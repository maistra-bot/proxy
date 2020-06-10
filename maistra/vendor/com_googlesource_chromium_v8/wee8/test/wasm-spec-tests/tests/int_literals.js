
'use strict';

let spectest = {
  print: console.log.bind(console),
  print_i32: console.log.bind(console),
  print_i32_f32: console.log.bind(console),
  print_f64_f64: console.log.bind(console),
  print_f32: console.log.bind(console),
  print_f64: console.log.bind(console),
  global_i32: 666,
  global_f32: 666,
  global_f64: 666,
  table: new WebAssembly.Table({initial: 10, maximum: 20, element: 'anyfunc'}),
  memory: new WebAssembly.Memory({initial: 1, maximum: 2})
};
let handler = {
  get(target, prop) {
    return (prop in target) ?  target[prop] : {};
  }
};
let registry = new Proxy({spectest}, handler);

function register(name, instance) {
  registry[name] = instance.exports;
}

function module(bytes, valid = true) {
  let buffer = new ArrayBuffer(bytes.length);
  let view = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; ++i) {
    view[i] = bytes.charCodeAt(i);
  }
  let validated;
  try {
    validated = WebAssembly.validate(buffer);
  } catch (e) {
    throw new Error("Wasm validate throws");
  }
  if (validated !== valid) {
    throw new Error("Wasm validate failure" + (valid ? "" : " expected"));
  }
  return new WebAssembly.Module(buffer);
}

function instance(bytes, imports = registry) {
  return new WebAssembly.Instance(module(bytes), imports);
}

function call(instance, name, args) {
  return instance.exports[name](...args);
}

function get(instance, name) {
  let v = instance.exports[name];
  return (v instanceof WebAssembly.Global) ? v.value : v;
}

function exports(name, instance) {
  return {[name]: instance.exports};
}

function run(action) {
  action();
}

function assert_malformed(bytes) {
  try { module(bytes, false) } catch (e) {
    if (e instanceof WebAssembly.CompileError) return;
  }
  throw new Error("Wasm decoding failure expected");
}

function assert_invalid(bytes) {
  try { module(bytes, false) } catch (e) {
    if (e instanceof WebAssembly.CompileError) return;
  }
  throw new Error("Wasm validation failure expected");
}

function assert_unlinkable(bytes) {
  let mod = module(bytes);
  try { new WebAssembly.Instance(mod, registry) } catch (e) {
    if (e instanceof WebAssembly.LinkError) return;
  }
  throw new Error("Wasm linking failure expected");
}

function assert_uninstantiable(bytes) {
  let mod = module(bytes);
  try { new WebAssembly.Instance(mod, registry) } catch (e) {
    if (e instanceof WebAssembly.RuntimeError) return;
  }
  throw new Error("Wasm trap expected");
}

function assert_trap(action) {
  try { action() } catch (e) {
    if (e instanceof WebAssembly.RuntimeError) return;
  }
  throw new Error("Wasm trap expected");
}

let StackOverflow;
try { (function f() { 1 + f() })() } catch (e) { StackOverflow = e.constructor }

function assert_exhaustion(action) {
  try { action() } catch (e) {
    if (e instanceof StackOverflow) return;
  }
  throw new Error("Wasm resource exhaustion expected");
}

function assert_return(action, expected) {
  let actual = action();
  switch (expected) {
    case "nan:canonical":
    case "nan:arithmetic":
    case "nan:any":
      // Note that JS can't reliably distinguish different NaN values,
      // so there's no good way to test that it's a canonical NaN.
      if (!Number.isNaN(actual)) {
        throw new Error("Wasm return value NaN expected, got " + actual);
      };
      return;
    default:
      if (!Object.is(actual, expected)) {
        throw new Error("Wasm return value " + expected + " expected, got " + actual);
      };
  }
}

// int_literals.wast:1
let $1 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x01\x7f\x60\x00\x01\x7e\x03\x9f\x80\x80\x80\x00\x1e\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x01\x01\x01\x01\x07\xb7\x83\x80\x80\x00\x1e\x08\x69\x33\x32\x2e\x74\x65\x73\x74\x00\x00\x08\x69\x33\x32\x2e\x75\x6d\x61\x78\x00\x01\x08\x69\x33\x32\x2e\x73\x6d\x61\x78\x00\x02\x0c\x69\x33\x32\x2e\x6e\x65\x67\x5f\x73\x6d\x61\x78\x00\x03\x08\x69\x33\x32\x2e\x73\x6d\x69\x6e\x00\x04\x0c\x69\x33\x32\x2e\x61\x6c\x74\x5f\x73\x6d\x69\x6e\x00\x05\x0c\x69\x33\x32\x2e\x69\x6e\x63\x5f\x73\x6d\x69\x6e\x00\x06\x0c\x69\x33\x32\x2e\x6e\x65\x67\x5f\x7a\x65\x72\x6f\x00\x07\x0d\x69\x33\x32\x2e\x6e\x6f\x74\x5f\x6f\x63\x74\x61\x6c\x00\x08\x14\x69\x33\x32\x2e\x75\x6e\x73\x69\x67\x6e\x65\x64\x5f\x64\x65\x63\x69\x6d\x61\x6c\x00\x09\x0d\x69\x33\x32\x2e\x70\x6c\x75\x73\x5f\x73\x69\x67\x6e\x00\x0a\x08\x69\x36\x34\x2e\x74\x65\x73\x74\x00\x0b\x08\x69\x36\x34\x2e\x75\x6d\x61\x78\x00\x0c\x08\x69\x36\x34\x2e\x73\x6d\x61\x78\x00\x0d\x0c\x69\x36\x34\x2e\x6e\x65\x67\x5f\x73\x6d\x61\x78\x00\x0e\x08\x69\x36\x34\x2e\x73\x6d\x69\x6e\x00\x0f\x0c\x69\x36\x34\x2e\x61\x6c\x74\x5f\x73\x6d\x69\x6e\x00\x10\x0c\x69\x36\x34\x2e\x69\x6e\x63\x5f\x73\x6d\x69\x6e\x00\x11\x0c\x69\x36\x34\x2e\x6e\x65\x67\x5f\x7a\x65\x72\x6f\x00\x12\x0d\x69\x36\x34\x2e\x6e\x6f\x74\x5f\x6f\x63\x74\x61\x6c\x00\x13\x14\x69\x36\x34\x2e\x75\x6e\x73\x69\x67\x6e\x65\x64\x5f\x64\x65\x63\x69\x6d\x61\x6c\x00\x14\x0d\x69\x36\x34\x2e\x70\x6c\x75\x73\x5f\x73\x69\x67\x6e\x00\x15\x0c\x69\x33\x32\x2d\x64\x65\x63\x2d\x73\x65\x70\x31\x00\x16\x0c\x69\x33\x32\x2d\x64\x65\x63\x2d\x73\x65\x70\x32\x00\x17\x0c\x69\x33\x32\x2d\x68\x65\x78\x2d\x73\x65\x70\x31\x00\x18\x0c\x69\x33\x32\x2d\x68\x65\x78\x2d\x73\x65\x70\x32\x00\x19\x0c\x69\x36\x34\x2d\x64\x65\x63\x2d\x73\x65\x70\x31\x00\x1a\x0c\x69\x36\x34\x2d\x64\x65\x63\x2d\x73\x65\x70\x32\x00\x1b\x0c\x69\x36\x34\x2d\x68\x65\x78\x2d\x73\x65\x70\x31\x00\x1c\x0c\x69\x36\x34\x2d\x68\x65\x78\x2d\x73\x65\x70\x32\x00\x1d\x0a\x8d\x83\x80\x80\x00\x1e\x89\x80\x80\x80\x00\x00\x41\x8d\xa0\xb7\xdd\x00\x0f\x0b\x85\x80\x80\x80\x00\x00\x41\x7f\x0f\x0b\x89\x80\x80\x80\x00\x00\x41\xff\xff\xff\xff\x07\x0f\x0b\x89\x80\x80\x80\x00\x00\x41\x81\x80\x80\x80\x78\x0f\x0b\x89\x80\x80\x80\x00\x00\x41\x80\x80\x80\x80\x78\x0f\x0b\x89\x80\x80\x80\x00\x00\x41\x80\x80\x80\x80\x78\x0f\x0b\x8c\x80\x80\x80\x00\x00\x41\x80\x80\x80\x80\x78\x41\x01\x6a\x0f\x0b\x85\x80\x80\x80\x00\x00\x41\x00\x0f\x0b\x85\x80\x80\x80\x00\x00\x41\x0a\x0f\x0b\x85\x80\x80\x80\x00\x00\x41\x7f\x0f\x0b\x85\x80\x80\x80\x00\x00\x41\x2a\x0f\x0b\x8d\x80\x80\x80\x00\x00\x42\xee\xd4\x99\xdd\xe0\xcd\xee\xd5\x0c\x0f\x0b\x85\x80\x80\x80\x00\x00\x42\x7f\x0f\x0b\x8e\x80\x80\x80\x00\x00\x42\xff\xff\xff\xff\xff\xff\xff\xff\xff\x00\x0f\x0b\x8e\x80\x80\x80\x00\x00\x42\x81\x80\x80\x80\x80\x80\x80\x80\x80\x7f\x0f\x0b\x8e\x80\x80\x80\x00\x00\x42\x80\x80\x80\x80\x80\x80\x80\x80\x80\x7f\x0f\x0b\x8e\x80\x80\x80\x00\x00\x42\x80\x80\x80\x80\x80\x80\x80\x80\x80\x7f\x0f\x0b\x91\x80\x80\x80\x00\x00\x42\x80\x80\x80\x80\x80\x80\x80\x80\x80\x7f\x42\x01\x7c\x0f\x0b\x85\x80\x80\x80\x00\x00\x42\x00\x0f\x0b\x85\x80\x80\x80\x00\x00\x42\x0a\x0f\x0b\x85\x80\x80\x80\x00\x00\x42\x7f\x0f\x0b\x85\x80\x80\x80\x00\x00\x42\x2a\x0f\x0b\x86\x80\x80\x80\x00\x00\x41\xc0\x84\x3d\x0b\x85\x80\x80\x80\x00\x00\x41\xe8\x07\x0b\x88\x80\x80\x80\x00\x00\x41\x99\x81\xbc\xd0\x00\x0b\x86\x80\x80\x80\x00\x00\x41\x8f\xd4\x06\x0b\x86\x80\x80\x80\x00\x00\x42\xc0\x84\x3d\x0b\x85\x80\x80\x80\x00\x00\x42\xe8\x07\x0b\x8b\x80\x80\x80\x00\x00\x42\x99\xb3\x82\x80\xf0\x81\xbc\x05\x0b\x86\x80\x80\x80\x00\x00\x42\x8f\xd4\x06\x0b");

// int_literals.wast:37
assert_return(() => call($1, "i32.test", []), 195_940_365);

// int_literals.wast:38
assert_return(() => call($1, "i32.umax", []), -1);

// int_literals.wast:39
assert_return(() => call($1, "i32.smax", []), 2_147_483_647);

// int_literals.wast:40
assert_return(() => call($1, "i32.neg_smax", []), -2_147_483_647);

// int_literals.wast:41
assert_return(() => call($1, "i32.smin", []), -2_147_483_648);

// int_literals.wast:42
assert_return(() => call($1, "i32.alt_smin", []), -2_147_483_648);

// int_literals.wast:43
assert_return(() => call($1, "i32.inc_smin", []), -2_147_483_647);

// int_literals.wast:44
assert_return(() => call($1, "i32.neg_zero", []), 0);

// int_literals.wast:45
assert_return(() => call($1, "i32.not_octal", []), 10);

// int_literals.wast:46
assert_return(() => call($1, "i32.unsigned_decimal", []), -1);

// int_literals.wast:47
assert_return(() => call($1, "i32.plus_sign", []), 42);

// int_literals.wast:49
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x8f\x80\x80\x80\x00\x01\x02\x24\x31\x08\x69\x36\x34\x2e\x74\x65\x73\x74\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9f\x80\x80\x80\x00\x01\x99\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\xee\xd4\x99\xdd\xe0\xcd\xee\xd5\x0c\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64.test", []), int64("913_028_331_277_281_902"))

// int_literals.wast:50
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x8f\x80\x80\x80\x00\x01\x02\x24\x31\x08\x69\x36\x34\x2e\x75\x6d\x61\x78\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x97\x80\x80\x80\x00\x01\x91\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x7f\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64.umax", []), int64("-1"))

// int_literals.wast:51
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x8f\x80\x80\x80\x00\x01\x02\x24\x31\x08\x69\x36\x34\x2e\x73\x6d\x61\x78\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\xa0\x80\x80\x80\x00\x01\x9a\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\xff\xff\xff\xff\xff\xff\xff\xff\xff\x00\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64.smax", []), int64("9_223_372_036_854_775_807"))

// int_literals.wast:52
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x93\x80\x80\x80\x00\x01\x02\x24\x31\x0c\x69\x36\x34\x2e\x6e\x65\x67\x5f\x73\x6d\x61\x78\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\xa0\x80\x80\x80\x00\x01\x9a\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x81\x80\x80\x80\x80\x80\x80\x80\x80\x7f\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64.neg_smax", []), int64("-9_223_372_036_854_775_807"))

// int_literals.wast:53
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x8f\x80\x80\x80\x00\x01\x02\x24\x31\x08\x69\x36\x34\x2e\x73\x6d\x69\x6e\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\xa0\x80\x80\x80\x00\x01\x9a\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x80\x80\x80\x80\x80\x80\x80\x80\x80\x7f\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64.smin", []), int64("-9_223_372_036_854_775_808"))

// int_literals.wast:54
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x93\x80\x80\x80\x00\x01\x02\x24\x31\x0c\x69\x36\x34\x2e\x61\x6c\x74\x5f\x73\x6d\x69\x6e\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\xa0\x80\x80\x80\x00\x01\x9a\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x80\x80\x80\x80\x80\x80\x80\x80\x80\x7f\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64.alt_smin", []), int64("-9_223_372_036_854_775_808"))

// int_literals.wast:55
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x93\x80\x80\x80\x00\x01\x02\x24\x31\x0c\x69\x36\x34\x2e\x69\x6e\x63\x5f\x73\x6d\x69\x6e\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\xa0\x80\x80\x80\x00\x01\x9a\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x81\x80\x80\x80\x80\x80\x80\x80\x80\x7f\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64.inc_smin", []), int64("-9_223_372_036_854_775_807"))

// int_literals.wast:56
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x93\x80\x80\x80\x00\x01\x02\x24\x31\x0c\x69\x36\x34\x2e\x6e\x65\x67\x5f\x7a\x65\x72\x6f\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x97\x80\x80\x80\x00\x01\x91\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x00\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64.neg_zero", []), int64("0"))

// int_literals.wast:57
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x94\x80\x80\x80\x00\x01\x02\x24\x31\x0d\x69\x36\x34\x2e\x6e\x6f\x74\x5f\x6f\x63\x74\x61\x6c\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x97\x80\x80\x80\x00\x01\x91\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x0a\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64.not_octal", []), int64("10"))

// int_literals.wast:58
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x9b\x80\x80\x80\x00\x01\x02\x24\x31\x14\x69\x36\x34\x2e\x75\x6e\x73\x69\x67\x6e\x65\x64\x5f\x64\x65\x63\x69\x6d\x61\x6c\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x97\x80\x80\x80\x00\x01\x91\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x7f\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64.unsigned_decimal", []), int64("-1"))

// int_literals.wast:59
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x94\x80\x80\x80\x00\x01\x02\x24\x31\x0d\x69\x36\x34\x2e\x70\x6c\x75\x73\x5f\x73\x69\x67\x6e\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x97\x80\x80\x80\x00\x01\x91\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x2a\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64.plus_sign", []), int64("42"))

// int_literals.wast:61
assert_return(() => call($1, "i32-dec-sep1", []), 1_000_000);

// int_literals.wast:62
assert_return(() => call($1, "i32-dec-sep2", []), 1_000);

// int_literals.wast:63
assert_return(() => call($1, "i32-hex-sep1", []), 168_755_353);

// int_literals.wast:64
assert_return(() => call($1, "i32-hex-sep2", []), 109_071);

// int_literals.wast:66
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x93\x80\x80\x80\x00\x01\x02\x24\x31\x0c\x69\x36\x34\x2d\x64\x65\x63\x2d\x73\x65\x70\x31\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x99\x80\x80\x80\x00\x01\x93\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\xc0\x84\x3d\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64-dec-sep1", []), int64("1_000_000"))

// int_literals.wast:67
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x93\x80\x80\x80\x00\x01\x02\x24\x31\x0c\x69\x36\x34\x2d\x64\x65\x63\x2d\x73\x65\x70\x32\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x98\x80\x80\x80\x00\x01\x92\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\xe8\x07\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64-dec-sep2", []), int64("1_000"))

// int_literals.wast:68
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x93\x80\x80\x80\x00\x01\x02\x24\x31\x0c\x69\x36\x34\x2d\x68\x65\x78\x2d\x73\x65\x70\x31\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9e\x80\x80\x80\x00\x01\x98\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x99\xb3\x82\x80\xf0\x81\xbc\x05\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64-hex-sep1", []), int64("3_078_696_982_321_561"))

// int_literals.wast:69
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x93\x80\x80\x80\x00\x01\x02\x24\x31\x0c\x69\x36\x34\x2d\x68\x65\x78\x2d\x73\x65\x70\x32\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x99\x80\x80\x80\x00\x01\x93\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x8f\xd4\x06\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "i64-hex-sep2", []), int64("109_071"))

// int_literals.wast:71
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:75
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:79
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:83
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:87
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:91
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:95
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:99
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:103
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:107
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:112
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:116
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:120
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:124
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:128
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:132
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:136
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:140
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:144
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");

// int_literals.wast:148
assert_malformed("\x3c\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x20\x71\x75\x6f\x74\x65\x3e");
