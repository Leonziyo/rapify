
const _ = require('lodash');
const validateJs = require('validate.js');
const InvalidApiParameterError = require('../errors/invalidApiParameter');
const ListError = require('../errors/list');

validateJs.validators.custom = (value, options, key, attributes) => {
    if (typeof options.validate === 'function' && value) {
        const success = options.validate(value, options, key, attributes);

        if (!success) {
            return options.message || 'not valid format';
        }
    } else if (value) {
        return options.message || 'not valid format';
    }

    return undefined;
};

validateJs.validators.requiredConditional = (value, options) => {
    if (typeof options._condition === 'function') {
        if (options._condition() && value === undefined) {
            return options.message || 'this field is required';
        }
    }

    return undefined;
};

const ignoreExtraFields = (input, rules = {}) => {
    const whiteList = {};

    for (const [key, value] of Object.entries(rules)) {
        if (value.__has_children) {
            whiteList[key] = ignoreExtraFields(input[key] || null, value);
        } else {
            whiteList[key] = input[key];
        }
    }

    return whiteList;
};

const sanitize = (input, rules) => {
    if (!rules) {
        return input;
    }

    const theInput = input;

    for (const [key, rule] of Object.entries(rules)) {
        if (rule.__has_children) {
            const result = sanitize(input[key] || {}, _.omit(rule, '__has_children'));

            if (Object.keys(result).length) {
                theInput[key] = result;
            }
        } else {
            // apply default value if input is undefined
            if (input[key] === undefined) {
                theInput[key] = typeof rule.default === 'function' ?
                    rule.default(input) : rule.default;
            } else {
                theInput[key] = input[key];
            }

            // apply sanitize function if available and input is not undefined
            if (typeof rule.sanitize === 'function' && theInput[key] !== undefined) {
                theInput[key] = rule.sanitize(theInput[key]);
            }
        }
    }

    return _.pickBy(theInput, n => n !== undefined);
};

const flattenRules = (rules, prefix = '') => {
    const newRules = {};

    for (const [key, rule] of Object.entries(rules)) {
        if (rule.__has_children) {
            const subRules = flattenRules(rule, `${prefix}${key}.`);

            for (const [subRuleKey, subRule] of Object.entries(subRules)) {
                newRules[subRuleKey] = subRule;
            }
        } else if (key !== '__has_children') {
            newRules[`${prefix}${key}`] = rule;
        }
    }

    return newRules;
};

const bindParams = (constraints, input) => {
    if (constraints && constraints.requiredConditional && typeof constraints.requiredConditional.condition === 'function') {
        // eslint-disable-next-line
        constraints.requiredConditional._condition = constraints.requiredConditional.condition.bind(null, input);
    }

    return constraints;
};

const validate = (input, rules) => {
    const newRules = flattenRules(rules);
    const constraints = _.mapValues(newRules, rule => bindParams(rule.constraints, input) || {});
    const errors = validateJs(input, constraints);
    return _.flatMapDeep(errors, (message, key) => new InvalidApiParameterError(key, message));
};

const validateRequest = async (req, res, next) => {
    try {
        if (res.locals.wasRouteHandled) {
            next();
            return;
        }

        const rule = req.rapify._endpoint;

        let params = req.params;
        let query = req.query;
        let body = req.body;
        let props = {};

        // get props by running the provided function for each propMap
        if (rule.propsMap) {
            Object.entries(rule.propsMap).forEach(async ([key, fn]) => {
                const temp = fn(req);

                if (temp && typeof temp.then === 'function') {
                    props[key] = await temp;
                } else {
                    props[key] = temp;
                }
            });
        }

        if (!rule.keepExtraFields) {
            props = ignoreExtraFields(props, rule.props);
            // do not ignore params because they are part of the URL
            // params = ignoreExtraFields(params, rule.params);
            query = ignoreExtraFields(query, rule.query);
            body = ignoreExtraFields(body, rule.body);
        }

        props = sanitize(props, rule.props || {});
        params = sanitize(params, rule.params || {});
        query = sanitize(query, rule.query || {});
        body = sanitize(body, rule.body || {});

        const propsErrors = validate(props, rule.props || {});
        const paramsErrors = validate(params, rule.params || {});
        const queryErrors = validate(query, rule.query || {});
        const bodyErrors = validate(body, rule.body || {});

        const allErrors = [
            ...bodyErrors,
            ...propsErrors,
            ...paramsErrors,
            ...queryErrors,
        ];

        if (allErrors.length) {
            throw new ListError(allErrors);
        }

        const input = {
            ...body,
            ...query,
            ...params,
            ...props,
        };

        req.rapify = {
            input,
            body,
            query,
            params,
            props,
        };

        if (typeof rule.customValidation === 'function') {
            const result = rule.customValidation(req);

            if (result && typeof result.then === 'function') {
                await result;
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = validateRequest;
