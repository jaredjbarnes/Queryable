(function(){

    var extend = function (d, b) {
        function __() { this.constructor = d; }
        __.prototype = b.prototype;
        d.prototype = new __();
    };

    var emptyFn = function(){};
    
    var assertInstance = function(Type, instance){
        if (!(instance instanceof Type)){
            throw new Error("Constructor run in the context of the window.");     
        }    
    };
    
    var getObject = function (namespace, scope) {
        scope = typeof scope === "undefined" ? (function(){return this;}()) : scope ;
    
        if (namespace === "") {
            return scope;
        }
    
        if (typeof namespace === "string") {
            var a = namespace.split('.');
            var length = a.length;
            var tmpObj;
    
            for (var x = 0; x < length; x++) {
                if (x === 0) {
                    if (typeof scope[a[0]] === 'undefined') {
                        return undefined;
                    } else {
                        tmpObj = scope[a[0]];
                    }
                } else {
                    if (typeof tmpObj[a[x]] === 'undefined') {
                        return undefined;
                    } else {
                        tmpObj = tmpObj[a[x]];
                    }
                }
            }
            return tmpObj;
        } else {
            return undefined;
        }
    };

    var Observable = function(){
        var self = this;
        
        assertInstance(Observable, self);
        
        var _listeners = {};
        
        self.observe = function(eventName, callback){
            if ( !_listeners[eventName] ){
                _listeners[eventName] = [];
            }
            
            _listeners[eventName].push(callback);
            return self;
        };
        
        self.unobserve = function(eventName, callback){
            var listeners = _listeners[eventName] || [];
            
            var index = listeners.indexOf(callback);
            if (index >= 0){
                listeners.splice(index, 1);
            }
            return self;
        };
        
        self.notify = function(event){
            var listeners = _listeners[event.type] || [];
            
            listeners.forEach(function(callback){
                callback(event);
            });
            return self;
        };
    };
    
    var Future = function(getValue){
        var self = this;
        
        assertInstance(Future, self);
               
        var observers = new Observable();
        
        var defaultState = {
            get: function(){
                _state = retrievingState;
                getValue(function(value){
                    if (_state === retrievingState){
                        self.isComplete = true;
                        self.value = value;
                        _state = completeState;
                        observers.notify({type: "then", value: value});
                    }
                }, function(error){
                    if (_state === retrievingState){
                        self.isComplete = true;
                        self.error = error;
                        _state = errorState;
                        observers.notify({type: "ifError", error: error});
                    }    
                });
            },
            then: function(callback){
                var listener = function(e){
                    callback(e.value);
                };
                observers.observe("then", listener);
            },
            ifError: function(callback){
                var listener = function(e){
                    callback(e.error);    
                };
                observers.observe("ifError", listener);
            },
            ifCanceled: function(callback){
                var listener = function(e){
                    callback();    
                };
                
                observers.observe("ifCanceled", listener);
            },
            cancel: function(){
                self.isComplete = true;
                _state = canceledState;
                observers.notify({type: "ifCanceled"});
            }
        };
        
        var retrievingState = {
            get: emptyFn,
            then: defaultState.then,
            ifError: defaultState.ifError,
            ifCanceled: defaultState.ifCanceled,
            cancel: defaultState.cancel
        };
        
        var errorState = {
            get: emptyFn,
            then: emptyFn,
            ifError: function(callback){
                setTimeout(function(){
                    callback(self.error);    
                }, 0);    
            },
            ifCanceled: emptyFn,
            cancel: emptyFn
        };
        
        var canceledState = {
            get: emptyFn,
            then: emptyFn,
            ifError: emptyFn,
            ifCanceled: function(callback){
                setTimeout(function(){
                    callback();
                }, 0);
            },
            cancel: emptyFn
        };
        
        var completeState = {
            get: emptyFn,
            then: function(callback){
                setTimeout(function(){
                    callback(self.value);    
                }, 0);
            },
            ifError: emptyFn,
            ifCanceled: emptyFn,
            cancel: emptyFn
        };
        
        var _state = defaultState;
        
        self.value = null;
        self.error = null;
        self.isComplete = false;
        
        self.then = function(callback){
            _state.get();
            _state.then(callback);
            return self;
        };
        self.ifError = function(callback){
            _state.get();
            _state.ifError(callback);
            return self;
        };
        self.ifCanceled = function(callback){
            _state.get();
            _state.ifCanceled(callback);
            return self;
        };
        self.cancel = function(){
            _state.cancel();
            return self;
        };
        
    };

    var Expression = function(name){
        var self = this;
        
        assertInstance(Expression, self);
        self.name = name;
    };
    
    var ValueExpression = function(name, value){
        var self = this;
        
        assertInstance(ValueExpression, self);
        
        Expression.call(self, name);
        self.value = value || null;
        
        self.copy = function(){
            return new ValueExpression(name, value);
        };
    };
    
    extend(ValueExpression, Expression);
    
    var ComplexExpression = function(name){
        var self = this;

        assertInstance(ComplexExpression, self);

        Expression.call(self, name);
        var children = Array.prototype.slice.call(arguments, 1);
        
        self.children = children;
        
        self.copy = function(){
            
            var expression = new ComplexExpression(name);
            children.forEach(function(childExpression){
                expression.children.push(childExpression);
            });
            
            return expression;
        };
    };
    
    extend(ComplexExpression, Expression);
    
    Expression.getExpressionType = function (value) {
        if (value instanceof Expression) {
            return value;
        }

        if (typeof value === "string") {
            return Expression.string(value);
        } else if (typeof value === "function") {
            return Expression.function(value);
        } else if (typeof value === "number") {
            return Expression.number(value);
        } else if (typeof value === "boolean") {
            return Expression.boolean(value);
        } else if (value === null) {
            return Expression["null"](value);
        } else if (typeof value === "undefined") {
            return Expression["undefined"](value);
        } else if (Array.isArray(value)) {
            return Expression.array(value);
        } else if (value instanceof Date) {
            return Expression.date(value);
        } else {
            return Expression.object(value);
        }
    };

    
    Expression.property = function (value) {
        return new ValueExpression("property", value);
    };

    Expression.constant = function (value) {
        return new ValueExpression("constant", value);
    };

    Expression.boolean = function (value) {
        var expression = new ValueExpression("boolean");
        expression.value = value;
        return expression;
    };

    Expression.string = function (value) {
        var expression = new ValueExpression("string");
        expression.value = value;
        return expression;
    };

    Expression.number = function (value) {
        var expression = new ValueExpression("number");
        expression.value = value;
        return expression;
    };

    Expression.object = function (value) {
        var expression = new ValueExpression("object");
        expression.value = value;
        return expression;
    };

    Expression.date = function (value) {
        var expression = new ValueExpression("date");
        expression.value = value;
        return expression;
    };

    Expression.function = function (value) {
        var expression = new ValueExpression("function");
        expression.value = value;
        return expression;
    };

    Expression["null"] = function (value) {
        var expression = new ValueExpression("null");
        expression.value = value;
        return expression;
    };

    Expression["undefined"] = function (value) {
        var expression = new ValueExpression("undefined");
        expression.value = value;
        return expression;
    };

    Expression.array = function (value) {
        var expression = new ValueExpression("array");
        expression.value = value;
        return expression;
    };
    
    Expression.equal = function () {
        var expression = new ComplexExpression("equal");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.notEqual = function () {
        var expression = new ComplexExpression("notEqual");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.or = function () {
        var expression = new ComplexExpression("or");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.and = function () {
        var expression = new ComplexExpression("and");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.where = function () {
        var expression = new ComplexExpression("where");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.greaterThan = function () {
        var expression = new ComplexExpression("greaterThan");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    Expression.lessThan = function () {
        var expression = new ComplexExpression("lessThan");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.greaterThanOrEqual = function () {
        var expression = new ComplexExpression("greaterThanOrEqual");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.lessThanOrEqual = function () {
        var expression = new ComplexExpression("lessThanOrEqual");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.orderBy = function () {
        var expression = new ComplexExpression("orderBy");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.descending = function () {
        var expression = new ComplexExpression("descending");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.ascending = function () {
        var expression = new ComplexExpression("ascending");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.skip = function () {
        var expression = new ComplexExpression("skip");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.take = function () {
        var expression = new ComplexExpression("take");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.toGuid = function () {
        var expression = new ComplexExpression("toGuid");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.substring = function () {
        var expression = new ComplexExpression("substring");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.substringOf = function () {
        var expression = new ComplexExpression("substringOf");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    
    Expression.startsWith = function () {
        var expression = new ComplexExpression("startsWith");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };

    Expression.endsWith = function () {
        var expression = new ComplexExpression("endsWith");
        Array.prototype.slice.call(arguments, 0).forEach(function (arg) {
            expression.children.push(arg);
        });
        return expression;
    };
    
    var ExpressionBuilder = function (Type, namespace) {
        var self = this;
        assertInstance(ExpressionBuilder, self);

        namespace = namespace || "";

        var findExpressionType = Expression.getExpressionType;

        self.equals = function (value) {
            var property = Expression.property(namespace);
            var constant = Expression.getExpressionType(value);
            return Expression.equal(property, constant);
        };

        self.notEqualTo = function (value) {
            var property = Expression.property(namespace);
            var constant = Expression.getExpressionType(value);
            return Expression.notEqual(property, constant);
        };

        self.greaterThan = function (value) {
            var property = Expression.property(namespace);
            var constant = Expression.getExpressionType(value);
            return Expression.greaterThan(property, constant);
        };

        self.lessThan = function (value) {
            var property = Expression.property(namespace);
            var constant = Expression.getExpressionType(value);
            return Expression.lessThan(property, constant);
        };

        self.greaterThanOrEqualTo = function (value) {
            var property = Expression.property(namespace);
            var constant = Expression.getExpressionType(value);
            return Expression.greaterThanOrEqual(property, constant);
        };

        self.lessThanOrEqualTo = function (value) {
            var property = Expression.property(namespace);
            var constant = Expression.getExpressionType(value);
            return Expression.lessThanOrEqual(property, constant);
        };

        self.substring = function (value) {
            return Expression.equal(Expression.substring(Expression.property(namespace)), Expression.getExpressionType(value));
        };

        self.substringOf = function (value) {
            return Expression.substringOf(Expression.property(namespace), Expression.string(value));
        };

        self.startsWith = function (value) {
            return Expression.startsWith(Expression.property(namespace), Expression.string(value));
        }

        self.endsWith = function (value) {
            return Expression.endsWith(Expression.property(namespace), Expression.string(value));
        }

        var mapping;
        if (typeof Type === "function") {
            mapping = new Type();
        } else {
            mapping = Type;
        }

        for (var property in mapping) (function (property) {
            Object.defineProperty(self, property, {
                get: function () {
                    var ChildType;
                    if (mapping[property] === null || typeof mapping[property] === "undefined") {
                        ChildType = Object;
                    } else {
                        if (typeof Type === "function") {
                            ChildType = mapping[property].constructor;
                        } else {
                            ChildType = mapping[property];
                        }
                    }

                    var expressionBuilder = new ExpressionBuilder(ChildType, (namespace ? (namespace + ".") : "") + property);
                    return expressionBuilder;
                }
            });
        }(property));

        self.toString = function () {
            return namespace;
        };

        return self;
    };
    
    Object.defineProperties(ExpressionBuilder, {
        "and": {
            enumerable: false,
            configurable: false,
            value: function () {
                return Expression.and.apply(Expression, arguments);
            }
        },
        "or": {
            enumerable: false,
            configurable: false,
            value: function () {
                return Expression.or.apply(Expression, arguments);
            }
        }
    });
    
    var Queryable = function (Type, expression) {
        var self = this;
        expression = expression || {};

        assertInstance(Queryable, self);

        var _Type = Type || Object;
        Object.defineProperty(self, "Type", {
            enumerable: false,
            get: function () {
                return _Type;
            },
            set: function (value) {
                if (value !== _Type) {
                    _Type = value;
                }
            }
        });

        var _provider = null;
        Object.defineProperty(self, "provider", {
            enumerable: false,
            get: function () {
                return _provider;
            },
            set: function (value) {
                var oldValue = _provider;
                if (value !== _provider) {
                    _provider = value;
                }
            }
        });

        var _whereExpression = expression.where || null;
        Object.defineProperty(self, "expression", {
            enumerable: false,
            get: function () {
                return {
                    where: _whereExpression,
                    take: _takeExpression,
                    skip: _skipExpression,
                    orderBy: _orderByExpression.length === 0 ? null : Expression.orderBy.apply(Expression, _orderByExpression)
                }
            }
        });

        var _where = function (fn) {
            fn = fn || function () { };
            var expression = fn.call(ExpressionBuilder, new ExpressionBuilder(Type));

            if (!(expression instanceof Expression)) {
                return self;
            }

            if (_whereExpression === null) {
                _whereExpression = Expression.where(expression);
            } else {
                throw new Error("Cannot call \"where\" twice.");
            }
            return self;
        };

        var _or = function (fn) {
            var rightExpression;

            if (fn instanceof Expression) {
                rightExpression = Expression.or.apply(Expression, arguments);
            } else {
                fn = fn || function () { };
                rightExpression = fn.call(ExpressionBuilder, new ExpressionBuilder(Type));
            }

            var copy = createCopy(expression);
            var whereExpression;
            
            if (_whereExpression) {
                var expressions = _whereExpression.copy();
                expressions.push(rightExpression);

                whereExpression = Expression.where(Expression.or.apply(Expression, expressions));
            } else {
                whereExpression = Expression.where(rightExpression);
            }

            copy.expression.where = whereExpression;
            
            return self;
        };

        var _and = function (fn) {
            if (fn instanceof Expression) {
                rightExpression = Expression.and.apply(Expression, arguments);
            } else {
                fn = fn || function () { };
                rightExpression = fn.call(ExpressionBuilder, new ExpressionBuilder(Type));
            }
            
            var copy = createCopy(expression);
            var whereExpression;
            
            if (_whereExpression) {
                var expressions = _whereExpression.copy();
                expressions.push(rightExpression);

                whereExpression = Expression.where(Expression.and.apply(Expression, expressions));
            } else {
                whereExpression = Expression.where(rightExpression);
            }
            
            copy.expression.where = whereExpression;

            return copy;
        };

        var _takeExpression = expression.take || null;
        var _take = function (value) {
            var expression = {};
            Object.keys(self.expression).forEach(function (key) {
                var value = self.expression[key];
                if (value) {
                    expression[key] = value.copy();
                } else {
                    expression[key] = null;
                }
            });

            expression.take = Expression.take(Expression.number(value));

            var copy = createCopy(expression);

            return copy;
        };

        var _skipExpression = expression.skip || null;
        var _skip = function (value) {
            var expression = {};
            Object.keys(self.expression).forEach(function (key) {
                var value = self.expression[key];
                if (value) {
                    expression[key] = value.copy();
                } else {
                    expression[key] = null;
                }
            });

            expression.skip = Expression.skip(Expression.number(value));

            var copy = createCopy(expression);

            return copy;
        };

        var _orderByExpression = expression.orderBy ? expression.orderBy.children : [];
        var _orderByDesc = function (fn) {
            var expression = {};
            Object.keys(self.expression).forEach(function (key) {
                var value = self.expression[key];
                if (value) {
                    expression[key] = value.copy();
                } else {
                    expression[key] = null;
                }
            });

            
            var orderBy = {children:[]};
            _orderByExpression.forEach(function (expression) {
                orderBy.children.push(expression.copy());
            });

            orderBy.children.push(Expression.descending(Expression.property(fn.call(self, new ExpressionBuilder(Type)).toString())));

            expression.orderBy = orderBy;

            var copy = createCopy(expression);

            return copy;
        };

        var _orderBy = function (fn) {
            var expression = {};
            Object.keys(self.expression).forEach(function (key) {
                var value = self.expression[key];
                if (value) {
                    expression[key] = value.copy();
                } else {
                    expression[key] = null;
                }
            });

            var orderBy = {children:[]};
            _orderByExpression.forEach(function (expression) {
                orderBy.children.push(expression.copy());
            });

            orderBy.children.push(Expression.ascending(Expression.property(fn.call(self, new ExpressionBuilder(Type)).toString())));

            expression.orderBy = orderBy;

            var copy = createCopy(expression);

            return copy;

        };

        var _toGuid = function (value) {
            return Expression.guid(Expression.constant(value));
        };

        var _execute = function () {
            if (_provider === null) {
                throw new Error("The queryable needs a provider property.");
            } else {
                return _provider.execute(self.expression);
            }
        };

        var _toArray = function () {
            return _provider.execute(self);
        };

        var _count = function () {
            return _provider.count(self);
        };

        var _all = function (func) {
            return _provider.all(self, func);
        };

        var _any = function (func) {
            return _provider.any(self, func);
        };

        var _firstOrDefault = function (func) {
            return _provider.firstOrDefault(self, func);
        };

        var _lastOrDefault = function (func) {
            return _provider.lastOrDefault(self, func);
        };

        var _first = function (func) {
            return _provider.first(self, func);
        };

        var _last = function (func) {
            return _provider.last(self, func);
        };

        var _select = function (forEachFunc) {
            return _provider.select(self, forEachFunc);
        };

        var _contains = function (item) {
            return _provider.contains(self, item);
        };

        var _include = function () {
            return _provider.include(self, item);
        };

        var _intersects = function (compareToQueryable) {
            if (compareToQueryable instanceof Array) {
                compareToQueryable = compareToQueryable.asQueryable();
            }
            return _provider.intersects(self, compareToQueryable);
        };

        var _ofType = function (Type) {
            var queryable = new Queryable(Type);
            queryable.provider = _provider;
            return queryable;
        };

        var createCopy = function (expression) {
            var queryable = new Queryable(Type, expression);
            queryable.provider = self.provider;
            return queryable;
        };

        var _copy = function () {
            return createCopy(self.expression);
        };

        var _merge = function (queryable) {
            var whereChildren = queryable.expression.where.children;
            var rightExpression = Expression.and.apply(Expression, whereChildren);
            if (_whereExpression) {
                var expressions = _whereExpression.children;
                expressions.push(rightExpression);

                _whereExpression = Expression.where(Expression.and.apply(Expression, expressions));
            } else {
                _whereExpression = Expression.where(rightExpression);
            }

            return self;
        }

        Object.defineProperties(self, {
            toGuid: {
                enumerable: false,
                configurable: false,
                value: _toGuid
            },
            where: {
                enumerable: false,
                configurable: false,
                value: _where
            },
            or: {
                enumerable: false,
                configurable: false,
                value: _or
            },
            and: {
                enumerable: false,
                configurable: false,
                value: _and
            },
            merge: {
                enumerable: false,
                configurable: false,
                value: _merge
            },
            take: {
                enumerable: false,
                configurable: false,
                value: _take
            },
            skip: {
                enumerable: false,
                configurable: false,
                value: _skip
            },
            all: {
                enumerable: false,
                configurable: false,
                value: _all
            },
            any: {
                enumerable: false,
                configurable: false,
                value: _any
            },
            first: {
                enumerable: false,
                configurable: false,
                value: _first
            },
            last: {
                enumerable: false,
                configurable: false,
                value: _last
            },
            firstOrDefault: {
                enumerable: false,
                configurable: false,
                value: _firstOrDefault
            },
            lastOrDefault: {
                enumerable: false,
                configurable: false,
                value: _lastOrDefault
            },
            count: {
                enumerable: false,
                configurable: false,
                value: _count
            },
            select: {
                enumerable: false,
                configurable: false,
                value: _select
            },
            contains: {
                enumerable: false,
                configurable: false,
                value: _contains
            },
            intersects: {
                enumerable: false,
                configurable: false,
                value: _intersects
            },
            orderBy: {
                enumerable: false,
                configurable: false,
                value: _orderBy
            },
            orderByDesc: {
                enumerable: false,
                configurable: false,
                value: _orderByDesc
            },
            toArray: {
                enumerable: false,
                configurable: false,
                value: _toArray
            },
            ofType: {
                enumerable: false,
                configurable: false,
                value: _ofType
            },
            copy: {
                enumerable: false,
                configurable: false,
                value: _copy
            }
        });


        return self;
    };
    
    var ExpressionParser = function (queryVisitor) {
        var self = this;
        
        assertInstance(ExpressionParser, self);

        self.queryVisitor = queryVisitor || {};
    
        self.parse = function (expression) {
            if (!expression) {
                return null;
            }
            var children = [];
    
            expression.children.forEach(function (expression) {
                if (!expression.children) {
                    children.push(expression);
                } else {
                    children.push(self.parse(expression));
                }
            });
    
            var func = self.queryVisitor[expression.name];
            if (!func) {
                throw new Error("The visitor doesn't support the \"" + expression.name + "\" expression.");
            }
    
            children.forEach(function (child, index) {
                if (child instanceof Expression) {
                    var func = self.queryVisitor[child.name];
                    if (!func) {
                        throw new Error("The visitor doesn't support the \"" + child.name + "\" expression.");
                    }
                    children[index] = func.call(self.queryVisitor, child);
                }
            });
            return func.apply(self.queryVisitor, children);
        };
    
        return self;
    };
    
    var ODataQueryVisitor = function () {
        var self = this;
        
        assertInstance(ODataQueryVisitor, self);
        
        // This Uppercases the namespacing to match the c# naming conventions.
        self.toServiceNamespace = function (value) {
            var array = value.split(".");
            var newArray = [];
            array.forEach(function (name) {
                newArray.push(name.substr(0, 1).toUpperCase() + name.substring(1));
            });
            return newArray.join(".");
        };
        
        return self;
    };


    ODataQueryVisitor.prototype["ascending"] = function (namespace) {
        return namespace + " asc";
    };

    ODataQueryVisitor.prototype["descending"] = function (namespace) {
        return namespace + " desc";
    };

    ODataQueryVisitor.prototype["orderBy"] = function () {
        var result = Array.prototype.slice.call(arguments, 0);
        return "&$orderby=" + result.join(", ");
    };

    ODataQueryVisitor.prototype["count"] = function (left, right) {
        return "&$inlinecount=allpages";
    };

    ODataQueryVisitor.prototype["where"] = function () {
        var self = this;
        return "&$filter=" + self["and"].apply(self.parsers, arguments);
    };

    ODataQueryVisitor.prototype["and"] = function () {
        var children = Array.prototype.slice.call(arguments, 0);
        var result = [];
        children.forEach(function (expression, index) {
            result.push(expression);
            if (index !== children.length - 1) {
                result.push(" and ");
            }
        });

        var joined = result.join("");

        if (joined === "") {
            return "";
        }

        return "(" + joined + ")";
    };

    ODataQueryVisitor.prototype["or"] = function () {
        var children = Array.prototype.slice.call(arguments, 0);
        var result = [];
        children.forEach(function (expression, index) {
            result.push(expression);
            if (index !== children.length - 1) {
                result.push(" or ");
            }
        });

        var joined = result.join("");

        if (joined === "") {
            return "";
        }

        return "(" + joined + ")";
    };

    ODataQueryVisitor.prototype["equal"] = function (left, right) {
        return "(" + left + " eq " + right + ")";
    };

    ODataQueryVisitor.prototype["notEqual"] = function (left, right) {
        return "(" + left + " ne " + right + ")";
    };

    ODataQueryVisitor.prototype["constant"] = function (expression) {
        return expression.value;
    };

    ODataQueryVisitor.prototype["property"] = function (expression) {
        return this.toServiceNamespace(expression.value);
    };

    ODataQueryVisitor.prototype["guid"] = function (value) {
        return "guid'" + value.replace("'", "''") + "'";
    };

    ODataQueryVisitor.prototype["substring"] = function (namespace, startAt, endAt) {
        return "substring(" + namespace + " "(startAt ? "," + startAt : "," + 0) + " " + (endAt ? "," + endAt : "") + ")";
    };

    ODataQueryVisitor.prototype["substringOf"] = function (namespace, value) {
        return "substringof(" + value + "," + namespace + ")";
    };

    ODataQueryVisitor.prototype["startsWith"] = function (namespace, value) {
        return "startswith(" + namespace + "," + value + ")";
    };

    ODataQueryVisitor.prototype["endsWith"] = function (namespace, value) {
        return "endswith(" + namespace + "," + value + ")";
    };

    ODataQueryVisitor.prototype["null"] = function (value) {
        return "null";
    };

    ODataQueryVisitor.prototype["undefined"] = function (value) {
        return "undefined";
    };

    ODataQueryVisitor.prototype["date"] = function (expression) {
        return "DateTime" + JSON.stringify(expression.value).replace(/"/g, "'") + "";
    };

    ODataQueryVisitor.prototype["string"] = function (expression) {
        return "'" + expression.value.replace("'", "''") + "'";
    };

    ODataQueryVisitor.prototype["number"] = function (expression) {
        return expression.value.toString();
    };

    ODataQueryVisitor.prototype["boolean"] = function (expression) {
        return expression.value.toString();
    };

    ODataQueryVisitor.prototype["array"] = function (expression) {
        throw new Error("Odata doesn't support representing an array.");
    }

    ODataQueryVisitor.prototype["greaterThan"] = function (left, right) {
        return "(" + left + " gt " + right + ")";
    };

    ODataQueryVisitor.prototype["lessThan"] = function (left, right) {
        var boundary = typeof right.value === "string" ? "'" : "";
        return "(" + left + " lt " + right + ")";
    };

    ODataQueryVisitor.prototype["greaterThanOrEqual"] = function (left, right) {
        var boundary = typeof right.value === "string" ? "'" : "";
        return "(" + left + " ge " + right + ")";
    };

    ODataQueryVisitor.prototype["lessThanOrEqual"] = function (left, right) {
        var boundary = typeof right.value === "string" ? "'" : "";
        return "(" + left + " le " + right + ")";
    };

    ODataQueryVisitor.prototype["not"] = function (left, right) {
        var boundary = typeof right.value === "string" ? "'" : "";
        return "(" + left + " not " + right + ")";
    };

    ODataQueryVisitor.prototype["skip"] = function (value) {
        return "&$skip=" + value;
    };

    ODataQueryVisitor.prototype["take"] = function (value) {
        return "&$top=" + value;
    };

    
    var odata = {
        toString: function(queryable){
            var visitor = new ODataQueryVisitor();
            var parser = new ExpressionParser(visitor);
            
            var where = parser.parse(queryable.expression.where);
            var orderBy = parser.parse(queryable.expression.orderBy);
            var skip = parser.parse(queryable.expression.skip);
            var take = parser.parse(queryable.expression.take);
            
            return where +" "+ orderBy + " " + skip + " " + take;
            
        }
    };
    
    var Ascending = function (expression) {
        var namespace = expression.value;
        var self = this;
        if (!(self instanceof Ascending)) {
            return new Ascending();
        }
    
        self.evaluate = function (a, b) {
            var aValue = getObject(namespace, a);
            var bValue = getObject(namespace, b);
    
            if (typeof aValue === "string" && typeof bValue === "string") {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
    
            if (aValue === bValue) {
                return 0;
            } else if (aValue < bValue) {
                return -1;
            } else if (aValue > bValue) {
                return 1;
            }
        };
    };
    
    var Descending = function (expression) {
        var namespace = expression.value;
        var self = this;
        if (!(self instanceof Descending)) {
            return new Descending();
        }
    
        self.evaluate = function (a, b) {
            var aValue = getObject(namespace, a);
            var bValue = getObject(namespace, b);
    
            if (typeof aValue === "string" && typeof bValue === "string") {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
    
            if (aValue === bValue) {
                return 0;
            } else if (aValue > bValue) {
                return -1;
            } else if (aValue < bValue) {
                return 1;
            }
        };
    };
    
    var ArrayQueryVisitor = function (sourceArray) {
        var self = this;
        
        assertInstance(ArrayQueryVisitor, self);

        var filteredArray = sourceArray.slice(0);

        var _value = null;
        Object.defineProperty(self, "value", {
            get: function () {
                return filteredArray;
            }
        });

        var _ascending = function (namespace) {
            return new Ascending(namespace);
        };

        var _descending = function (namespace) {
            return new Descending(namespace);
        };

        var _greaterThan = function (left, right) {
            var results = [];
            var self = this;
            sourceArray.forEach(function (item) {
                // This will compare the base object.
                var obj;
                if (left.value === "") {
                    obj = item;
                } else {
                    obj = getObject(left.value, item);
                }
                if (obj > right.value.value) {
                    results.push(item);
                }
            });
            return results;
        };

        var _lessThan = function (left, right) {
            var results = [];
            var self = this;
            sourceArray.forEach(function (item) {
                // This will compare the base object.
                var obj;
                if (left.value === "") {
                    obj = item;
                } else {
                    obj = getObject(left.value, item);
                }
                if (obj < right.value.value) {
                    results.push(item);
                }
            });
            return results;
        };

        var _greaterThanOrEqual = function (left, right) {
            var results = [];
            var self = this;
            sourceArray.forEach(function (item) {
                // This will compare the base object.
                var obj;
                if (left.value === "") {
                    obj = item;
                } else {
                    obj = getObject(left.value, item);
                }
                if (obj >= right.value.value) {
                    results.push(item);
                }
            });
            return results;
        };

        var _lessThanOrEqual = function (left, right) {
            var results = [];
            var self = this;
            sourceArray.forEach(function (item) {
                // This will compare the base object.
                var obj;
                if (left.value === "") {
                    obj = item;
                } else {
                    obj = getObject(left.value, item);
                }
                if (obj <= right.value.value) {
                    results.push(item);
                }
            });
            return results;
        };

        _orderBy = function () {
            var self = this;
            var orderByCriterions = Array.prototype.slice.call(arguments, 0);

            filteredArray.sort(function (itemA, itemB) {
                var returnValue = 0;
                orderByCriterions.every(function (orderBy) {
                    returnValue = orderBy.evaluate(itemA, itemB);
                    if (returnValue === 0) {
                        return true;
                    } else {
                        return false;
                    }
                });
                return returnValue;
            });

            return filteredArray;
        };

        var _and = function () {
            var results = [];
            var children = Array.prototype.slice.call(arguments, 0);
            children[0].forEach(function (item, index) {
                var pass = children.every(function (array, index) {
                    return array.indexOf(item) >= 0
                });

                if (pass) {
                    results.push(item);
                }
            });

            return results;
        };

        var _where = function () {
            var self = this;
            return sourceArray = filteredArray = self.and.apply(self, arguments);
        };

        var _or = function () {
            var results = [];
            var children = Array.prototype.slice.call(arguments, 0);
            var match = children.forEach(function (array, index) {
                array.forEach(function (item) {
                    if (results.indexOf(item) < 0) {
                        results.push(item);
                    }
                })
            });

            return results;
        };

        var _string = function (value) {
            return value;
        };

        var _constant = function (expression) {
            return expression;
        };

        var _property = function (expression) {
            return expression;
        };

        var _guid = function (value) {
            return value;
        };

        var _null = function (value) {
            return value;
        };

        var _undefined = function (value) {
            return value;
        };

        var _number = function (value) {
            return value;
        };

        var _object = function (value) {
            return value;
        };

        var _date = function (value) {
            return value;
        };

        var _function = function (value) {
            return value;
        };

        var _boolean = function (value) {
            return value;
        };

        var _array = function (value) {
            return value;
        };

        var _startsWith = function (left, right) {
            var results = [];
            var self = this;
            sourceArray.forEach(function (item) {
                // This will compare the base object.
                var obj;
                if (left.value === "") {
                    obj = item;
                } else {
                    obj = getObject(left.value, item);
                }
                if (obj.toLowerCase().indexOf(right.value.toLowerCase()) === 0) {
                    results.push(item);
                }
            });
            return results;
        };

        var _endsWith = function (left, right) {
            var results = [];
            var self = this;
            sourceArray.forEach(function (item) {
                // This will compare the base object.
                var obj;
                if (left.value === "") {
                    obj = item;
                } else {
                    obj = getObject(left.value, item);
                }
                if (obj.toLowerCase().lastIndexOf(right.value.toLowerCase()) === obj.length - right.value.length) {
                    results.push(item);
                }
            });
            return results;
        };

        var _substringOf = function (left, right) {
            var results = [];
            var self = this;
            sourceArray.forEach(function (item) {
                // This will compare the base object.
                var obj;
                if (left.value === "") {
                    obj = item;
                } else {
                    obj = getObject(left.value, item);
                }
                if (right.value.trim() === "") {
                    results.push(item);
                } else if (obj.toLowerCase().indexOf(right.value.toLowerCase()) >= 0) {
                    results.push(item);
                }
            });
            return results;
        };

        var _equal = function (left, right) {
            var results = [];
            var self = this;
            sourceArray.forEach(function (item) {
                // This will compare the base object.
                var obj;
                if (left.value === "") {
                    obj = item;
                } else {
                    obj = getObject(left.value, item);
                }

                if (obj === right.value) {
                    results.push(item);
                }
            });
            return results;
        };

        var _notEqual = function (left, right) {
            var self = this;

            var results = [];
            var self = this;
            sourceArray.forEach(function (item) {
                // This will compare the base object.
                var obj;
                if (left.value === "") {
                    obj = item;
                } else {
                    obj = getObject(left.value, item);
                }

                if (obj !== right.value) {
                    results.push(item);
                }
            });
            return results;
        };

        var _skip = function (valueExpression) {
            var self = this;
            var value = valueExpression.value;
            for (var x = 0 ; x < value && filteredArray.length > 0; x++) {
                filteredArray.shift();
            }
            return filteredArray;
        };

        var _take = function (valueExpression) {
            var self = this;
            var newFilteredArray = [];
            var value = valueExpression.value;
            value = value < filteredArray.length ? value : filteredArray.length;
            for (var x = 0 ; x < value ; x++) {
                newFilteredArray.push(filteredArray.shift());
            }
            return filteredArray = newFilteredArray;
        };

        Object.defineProperties(self, {
            "descending": { enumerable: false, configurable: false, value: _descending },
            "ascending": { enumerable: false, configurable: false, value: _ascending },
            "greaterThan": { enumerable: false, configurable: false, value: _greaterThan },
            "lessThan": { enumerable: false, configurable: false, value: _lessThan },
            "greaterThanOrEqual": { enumerable: false, configurable: false, value: _greaterThanOrEqual },
            "lessThanOrEqual": { enumerable: false, configurable: false, value: _lessThanOrEqual },
            "orderBy": { enumerable: false, configurable: false, value: _orderBy },
            "and": { enumerable: false, configurable: false, value: _and },
            "where": { enumerable: false, configurable: false, value: _where },
            "or": { enumerable: false, configurable: false, value: _or },
            "string": { enumerable: false, configurable: false, value: _string },
            "constant": { enumerable: false, configurable: false, value: _constant },
            "property": { enumerable: false, configurable: false, value: _property },
            "guid": { enumerable: false, configurable: false, value: _guid },
            "null": { enumerable: false, configurable: false, value: _null },
            "undefined": { enumerable: false, configurable: false, value: _undefined },
            "number": { enumerable: false, configurable: false, value: _number },
            "object": { enumerable: false, configurable: false, value: _object },
            "date": { enumerable: false, configurable: false, value: _date },
            "function": { enumerable: false, configurable: false, value: _function },
            "boolean": { enumerable: false, configurable: false, value: _boolean },
            "array": { enumerable: false, configurable: false, value: _array },
            "startsWith": { enumerable: false, configurable: false, value: _startsWith },
            "endsWith": { enumerable: false, configurable: false, value: _endsWith },
            "substringOf": { enumerable: false, configurable: false, value: _substringOf },
            "equal": { enumerable: false, configurable: false, value: _equal },
            "notEqual": { enumerable: false, configurable: false, value: _notEqual },
            "skip": { enumerable: false, configurable: false, value: _skip },
            "take": { enumerable: false, configurable: false, value: _take }
        });

        return self;
    };

    var QueryProvider = function () {
        var self = this;
        assertInstance(QueryProvider, self);

        self.count = function (queryable) {
            return new Future(function (setValue, setError) {
                self.toArray(queryable).then(function (array) {
                    setValue(array.length);
                });
            });
        };

        self.any = function (queryable, func) {
            return new Future(function (setValue, setError) {
                self.toArray(queryable).then(function (array) {
                    var visitor = new ArrayQueryVisitor(array);
                    var parser = new ExpressionParser(visitor);
                    var results;

                    if (typeof func === "function") {
                        results = parser.parse(func.call(queryable, new ExpressionBuilder(queryable.Type)));
                    } else {
                        results = array;
                    }

                    if (results.length > 0) {
                        setValue(true);
                    } else {
                        setValue(false);
                    }

                });
            });
        };

        self.all = function (queryable, func) {
            return new Future(function (setValue, setError) {
                self.toArray(queryable).then(function (array) {
                    var visitor = new ArrayQueryVisitor(array);
                    var parser = new ExpressionParser(visitor);
                    var results;

                    if (typeof func === "function") {
                        results = parser.parse(func.call(queryable, new ExpressionBuilder(queryable.Type)));
                    } else {
                        results = array;
                    }

                    setValue(results.length === array.length);
                });
            });
        };

        self.firstOrDefault = function (queryable, func) {
            return new Future(function (setValue, setError) {
                self.toArray(queryable).then(function (array) {
                    var visitor = new ArrayQueryVisitor(array);
                    var parser = new ExpressionParser(visitor);
                    var results;

                    if (typeof func === "function") {
                        results = parser.parse(func.call(queryable, new ExpressionBuilder(queryable.Type)));
                    } else {
                        results = array;
                    }

                    setValue(results[0] || null);
                });
            });
        };

        self.lastOrDefault = function (queryable, func) {
            return new Future(function (setValue, setError) {
                self.toArray(queryable).then(function (array) {
                    var visitor = new ArrayQueryVisitor(array);
                    var parser = new ExpressionParser(visitor);
                    var results;

                    if (typeof func === "function") {
                        results = parser.parse(func.call(queryable, new ExpressionBuilder(queryable.Type)));
                    } else {
                        results = array;
                    }

                    setValue(results[results.length - 1] || null);
                });
            });
        };

        self.first = function (queryable, func) {
            return new Future(function (setValue, setError) {
                self.toArray(queryable).then(function (array) {
                    var visitor = new ArrayQueryVisitor(array);
                    var parser = new ExpressionParser(visitor);
                    var results;

                    if (typeof func === "function") {
                        results = parser.parse(func.call(queryable, new ExpressionBuilder(queryable.Type)));
                    } else {
                        results = array;
                    }

                    var result = results[0];

                    if (result) {
                        setValue(result);
                    } else {
                        setError(new Error("Couldn't find a match."));
                    }
                });
            });
        };

        self.last = function (queryable, func) {
            return new Future(function (setValue, setError) {
                self.toArray(queryable).then(function (array) {
                    var visitor = new ArrayQueryVisitor(array);
                    var parser = new ExpressionParser(visitor);
                    var results;

                    if (typeof func === "function") {
                        results = parser.parse(func.call(queryable, new ExpressionBuilder(queryable.Type)));
                    } else {
                        results = array;
                    }

                    var result = results[results.length - 1];

                    if (result) {
                        setValue(result);
                    } else {
                        setError(new Error("Couldn't find a match."));
                    }
                });
            });
        };

        self.contains = function (queryable, func) {
            return new Future(function (setValue, setError) {
                self.toArray(queryable).then(function (array) {
                    var visitor = new ArrayQueryVisitor(array);
                    var parser = new ExpressionParser(visitor);
                    var results;

                    if (typeof func === "function") {
                        results = parser.parse(func.call(queryable, new ExpressionBuilder(queryable.Type)));
                    } else {
                        results = array;
                    }

                    setValue(results > 0);
                });
            });
        };

        self.select = function (queryable, forEachFunc) {
            return new Future(function (setValue, setError) {
                self.toArray(queryable).then(function (array) {
                    var objects = [];

                    array.forEach(function (item) {
                        objects.push(forEachFunc(item));
                    });

                    setValue(objects);
                });
            });
        };

        self.intersects = function (queryable, compareToQueryable) {
            return new Future(function (setValue, setError) {
                var task = new BASE.async.Task();
                task.add(self.toArray(queryable));
                task.add(compareToQueryable.toArray());
                task.start().whenAll(function (futures) {
                    var intersects = [];
                    var array1 = futures[0].value;
                    var array2 = futures[1].value;

                    array1.forEach(function (item) {
                        if (array2.indexOf(item) > -1) {
                            intersects.push(item);
                        }
                    });

                    setValue(intersects);
                });
            });
        };

        self.toArray = function (queryable) {
            return new BASE.async.Future(function (setValue, setError) {
                setTimeout(function () {
                    setValue([]);
                }, 0);
            });
        };

        //This should always return a Future of an array of objects.
        self.execute = self.toArray;
    };
    
    var ArrayProvider = function (array) {
        var self = this;
        assertInstance(ArrayProvider, self);

        QueryProvider.call(self);
        
        self.toArray = function (queryable) {
            var self = this;
            return new Future(function (setValue, setError) {
                var Type = queryable.Type;
                var builder = new ArrayQueryVisitor(array.slice(0));
                var parser = new ExpressionParser(builder);

                parser.parse(queryable.expression.where);
                parser.parse(queryable.expression.skip);
                parser.parse(queryable.expression.take);
                parser.parse(queryable.expression.orderBy);

                setTimeout(function () {
                    setValue(builder.value);
                }, 0);
            });
        };

        self.execute = self.toArray;
    };
    
    extend(ArrayProvider, QueryProvider);

    Object.defineProperty(Array.prototype, "asQueryable", {
        enumerable: false,
        configurable: false,
        value: function(Type){
            var queryable = new Queryable(Type);
            queryable.provider = new ArrayProvider(this);
            
            return queryable;
        }
    });
    
    window.BoostJS = {};
    
    BoostJS.Observable = Observable;
    BoostJS.Future = Future;
    BoostJS.Expression = Expression;
    BoostJS.ExpressionBuilder = ExpressionBuilder;
    BoostJS.Queryable = Queryable;
    BoostJS.ExpressionParser = ExpressionParser;
    BoostJS.ODataQueryVisitor = ODataQueryVisitor;
    BoostJS.odata = odata;
    BoostJS.ArrayQueryVisitor = ArrayQueryVisitor;
    BoostJS.QueryProvider = QueryProvider;
    BoostJS.ArrayProvider = ArrayProvider;
    
}());