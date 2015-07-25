'use strict';

exports.__esModule = true;
exports.configure = configure;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _aureliaBinding = require('aurelia-binding');

var AsyncExpression = (function (_Expression) {
  _inherits(AsyncExpression, _Expression);

  function AsyncExpression(expression, ready) {
    _classCallCheck(this, AsyncExpression);

    _Expression.call(this);
    this.expression = expression;
    this.ready = ready;
  }

  AsyncExpression.prototype.evaluate = function evaluate(scope, valueConverters) {
    var promise = this.expression.evaluate(scope);
    if (promise) {
      return this.ready ? promise.hasOwnProperty('__value') : promise.__value;
    }
    return this.ready ? false : undefined;
  };

  AsyncExpression.prototype.accept = function accept(visitor) {
    this.expression.accept(visitor);
    visitor.write('..');
  };

  AsyncExpression.prototype.connect = function connect(binding, scope) {
    var info = this.expression.connect(binding, scope);
    return {
      value: info.value ? info.value.__value : undefined,
      observer: new PromiseObserver(info.value, info.observer, this.ready)
    };
  };

  return AsyncExpression;
})(_aureliaBinding.Expression);

exports.AsyncExpression = AsyncExpression;

function configure(aurelia) {
  aurelia.container.autoRegister(Parser, _aureliaBinding.Parser);
}

var Parser = (function (_StandardParser) {
  _inherits(Parser, _StandardParser);

  function Parser() {
    _classCallCheck(this, Parser);

    _StandardParser.apply(this, arguments);
  }

  Parser.prototype.parse = function parse(input) {
    input = input || '';

    return this.cache[input] || (this.cache[input] = new ParserImplementation(this.lexer, input).parseChain());
  };

  return Parser;
})(_aureliaBinding.Parser);

exports.Parser = Parser;

var ParserImplementation = (function (_StandardParserImplementation) {
  _inherits(ParserImplementation, _StandardParserImplementation);

  function ParserImplementation() {
    _classCallCheck(this, ParserImplementation);

    _StandardParserImplementation.apply(this, arguments);
  }

  ParserImplementation.prototype.parseAccessOrCallMember = function parseAccessOrCallMember(result) {
    result = result || this.parsePrimary();

    while (true) {
      var async, args;
      if (this.optional('.')) {
        async = this.optional('.');
        var name = this.peek.text;
        this.advance();
        if (async) {
          if (name !== 'value' && name !== 'ready') {
            throw new Error('Expected "..value" or "..ready".');
          }
          result = new AsyncExpression(result, name === 'ready');
          return this.parseAccessOrCallMember(result);
        }
        if (this.optional('(')) {
          args = this.parseExpressionList(')');
          this.expect(')');
          result = new _aureliaBinding.CallMember(result, name, args);
        } else {
          result = new _aureliaBinding.AccessMember(result, name);
        }
      } else if (this.optional('[')) {
        var key = this.parseExpression();
        this.expect(']');
        result = new _aureliaBinding.AccessKeyed(result, key);
      } else if (this.optional('(')) {
        args = this.parseExpressionList(')');
        this.expect(')');
        result = new _aureliaBinding.CallFunction(result, args);
      } else {
        return result;
      }
    }
  };

  return ParserImplementation;
})(_aureliaBinding.ParserImplementation);

exports.ParserImplementation = ParserImplementation;

var PromiseObserver = (function () {
  function PromiseObserver(promise, observer, ready) {
    var _this = this;

    _classCallCheck(this, PromiseObserver);

    this.promise = promise;
    this.ready = ready;
    this.lastValue = this.getCurrent();

    if (observer) {
      observer.subscribe(function (promise) {
        if (promise === _this.promise) {
          return;
        }
        _this.promise = promise;
        _this.attach();
        _this.notify();
      });
    }

    this.attach();
  }

  PromiseObserver.prototype.attach = function attach() {
    var _this2 = this;

    var promise = this.promise;
    if (!promise) {
      return;
    }
    if (!promise.then) {
      throw new Error('Promise object has no "then" method.');
    }
    promise.then(function (value) {
      if (promise !== _this2.promise) {
        return;
      }
      promise.__value = value;
      _this2.notify();
    });
  };

  PromiseObserver.prototype.getCurrent = function getCurrent() {
    if (this.promise) {
      return this.ready ? this.promise.hasOwnProperty('__value') : this.promise.__value;
    }
    return this.ready ? false : undefined;
  };

  PromiseObserver.prototype.notify = function notify() {
    var value = this.getCurrent();

    if (!this.callback || value === this.lastValue) {
      return;
    }

    this.lastValue = value;
    this.callback(value);
  };

  PromiseObserver.prototype.subscribe = function subscribe(callback) {
    var _this3 = this;

    this.callback = callback;
    return function () {
      return _this3.callback = null;
    };
  };

  PromiseObserver.prototype.dispose = function dispose() {
    this.callback = null;
    this.promise = null;
    this.scope = null;
    this.lastValue = null;
  };

  return PromiseObserver;
})();

exports.PromiseObserver = PromiseObserver;