import {Parser} from '../src/parser';
import {AsyncExpression} from '../src/async-expression';
import {
  AccessMember,
  AccessScope,
  ValueConverter,
  Conditional
} from 'aurelia-binding';

describe('Parser', () => {
  let parser;
  beforeAll(() => {
    parser = new Parser();
  });

  it('parses standard expressions', () => {
    expect(parser.parse('foo') instanceof AccessScope).toBe(true);
    expect(parser.parse('foo.bar') instanceof AccessMember).toBe(true);
    expect(parser.parse('foo.bar[0] | baz') instanceof ValueConverter).toBe(true);
    expect(parser.parse('foo ? bar : baz') instanceof Conditional).toBe(true);
  });

  it('parses async expressions', () => {
    expect(parser.parse('foo..value') instanceof AsyncExpression).toBe(true);
    expect(parser.parse('foo..ready') instanceof AsyncExpression).toBe(true);
    expect(() => parser.parse('foo..bar')).toThrow(new Error('Expected "..value" or "..ready".'));
    expect(parser.parse('foo..value.bar') instanceof AccessMember).toBe(true);
  });
});
