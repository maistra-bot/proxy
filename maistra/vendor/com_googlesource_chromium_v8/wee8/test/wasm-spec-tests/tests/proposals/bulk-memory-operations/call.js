
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
  if (!Object.is(actual, expected)) {
    throw new Error("Wasm return value " + expected + " expected, got " + actual);
  };
}

function assert_return_canonical_nan(action) {
  let actual = action();
  // Note that JS can't reliably distinguish different NaN values,
  // so there's no good way to test that it's a canonical NaN.
  if (!Number.isNaN(actual)) {
    throw new Error("Wasm return value NaN expected, got " + actual);
  };
}

function assert_return_arithmetic_nan(action) {
  // Note that JS can't reliably distinguish different NaN values,
  // so there's no good way to test for specific bitpatterns here.
  let actual = action();
  if (!Number.isNaN(actual)) {
    throw new Error("Wasm return value NaN expected, got " + actual);
  };
}

// call.wast:3
let $1 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\xd1\x80\x80\x80\x00\x10\x60\x02\x7f\x7f\x01\x7f\x60\x00\x01\x7f\x60\x00\x01\x7e\x60\x00\x01\x7d\x60\x00\x01\x7c\x60\x01\x7f\x01\x7f\x60\x01\x7e\x01\x7e\x60\x01\x7d\x01\x7d\x60\x01\x7c\x01\x7c\x60\x02\x7d\x7f\x01\x7f\x60\x02\x7f\x7e\x01\x7e\x60\x02\x7c\x7d\x01\x7d\x60\x02\x7e\x7c\x01\x7c\x60\x02\x7e\x7e\x01\x7e\x60\x01\x7e\x01\x7f\x60\x00\x00\x03\xc0\x80\x80\x80\x00\x3f\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x01\x02\x03\x04\x01\x02\x03\x04\x01\x02\x03\x04\x06\x0d\x06\x0e\x0e\x0f\x0f\x0f\x01\x01\x01\x01\x01\x01\x01\x01\x00\x01\x01\x01\x0f\x0f\x01\x01\x0f\x01\x01\x01\x01\x01\x05\x07\x03\x01\x01\x01\x01\x01\x02\x04\x85\x80\x80\x80\x00\x01\x70\x01\x01\x01\x05\x83\x80\x80\x80\x00\x01\x00\x01\x06\x86\x80\x80\x80\x00\x01\x7f\x01\x41\x0a\x0b\x07\x8a\x86\x80\x80\x00\x2f\x08\x74\x79\x70\x65\x2d\x69\x33\x32\x00\x0c\x08\x74\x79\x70\x65\x2d\x69\x36\x34\x00\x0d\x08\x74\x79\x70\x65\x2d\x66\x33\x32\x00\x0e\x08\x74\x79\x70\x65\x2d\x66\x36\x34\x00\x0f\x0e\x74\x79\x70\x65\x2d\x66\x69\x72\x73\x74\x2d\x69\x33\x32\x00\x10\x0e\x74\x79\x70\x65\x2d\x66\x69\x72\x73\x74\x2d\x69\x36\x34\x00\x11\x0e\x74\x79\x70\x65\x2d\x66\x69\x72\x73\x74\x2d\x66\x33\x32\x00\x12\x0e\x74\x79\x70\x65\x2d\x66\x69\x72\x73\x74\x2d\x66\x36\x34\x00\x13\x0f\x74\x79\x70\x65\x2d\x73\x65\x63\x6f\x6e\x64\x2d\x69\x33\x32\x00\x14\x0f\x74\x79\x70\x65\x2d\x73\x65\x63\x6f\x6e\x64\x2d\x69\x36\x34\x00\x15\x0f\x74\x79\x70\x65\x2d\x73\x65\x63\x6f\x6e\x64\x2d\x66\x33\x32\x00\x16\x0f\x74\x79\x70\x65\x2d\x73\x65\x63\x6f\x6e\x64\x2d\x66\x36\x34\x00\x17\x03\x66\x61\x63\x00\x18\x07\x66\x61\x63\x2d\x61\x63\x63\x00\x19\x03\x66\x69\x62\x00\x1a\x04\x65\x76\x65\x6e\x00\x1b\x03\x6f\x64\x64\x00\x1c\x07\x72\x75\x6e\x61\x77\x61\x79\x00\x1d\x0e\x6d\x75\x74\x75\x61\x6c\x2d\x72\x75\x6e\x61\x77\x61\x79\x00\x1e\x0f\x61\x73\x2d\x73\x65\x6c\x65\x63\x74\x2d\x66\x69\x72\x73\x74\x00\x20\x0d\x61\x73\x2d\x73\x65\x6c\x65\x63\x74\x2d\x6d\x69\x64\x00\x21\x0e\x61\x73\x2d\x73\x65\x6c\x65\x63\x74\x2d\x6c\x61\x73\x74\x00\x22\x0f\x61\x73\x2d\x69\x66\x2d\x63\x6f\x6e\x64\x69\x74\x69\x6f\x6e\x00\x23\x0e\x61\x73\x2d\x62\x72\x5f\x69\x66\x2d\x66\x69\x72\x73\x74\x00\x24\x0d\x61\x73\x2d\x62\x72\x5f\x69\x66\x2d\x6c\x61\x73\x74\x00\x25\x11\x61\x73\x2d\x62\x72\x5f\x74\x61\x62\x6c\x65\x2d\x66\x69\x72\x73\x74\x00\x26\x10\x61\x73\x2d\x62\x72\x5f\x74\x61\x62\x6c\x65\x2d\x6c\x61\x73\x74\x00\x27\x16\x61\x73\x2d\x63\x61\x6c\x6c\x5f\x69\x6e\x64\x69\x72\x65\x63\x74\x2d\x66\x69\x72\x73\x74\x00\x29\x14\x61\x73\x2d\x63\x61\x6c\x6c\x5f\x69\x6e\x64\x69\x72\x65\x63\x74\x2d\x6d\x69\x64\x00\x2a\x15\x61\x73\x2d\x63\x61\x6c\x6c\x5f\x69\x6e\x64\x69\x72\x65\x63\x74\x2d\x6c\x61\x73\x74\x00\x2b\x0e\x61\x73\x2d\x73\x74\x6f\x72\x65\x2d\x66\x69\x72\x73\x74\x00\x2c\x0d\x61\x73\x2d\x73\x74\x6f\x72\x65\x2d\x6c\x61\x73\x74\x00\x2d\x14\x61\x73\x2d\x6d\x65\x6d\x6f\x72\x79\x2e\x67\x72\x6f\x77\x2d\x76\x61\x6c\x75\x65\x00\x2e\x0f\x61\x73\x2d\x72\x65\x74\x75\x72\x6e\x2d\x76\x61\x6c\x75\x65\x00\x2f\x0f\x61\x73\x2d\x64\x72\x6f\x70\x2d\x6f\x70\x65\x72\x61\x6e\x64\x00\x30\x0b\x61\x73\x2d\x62\x72\x2d\x76\x61\x6c\x75\x65\x00\x31\x12\x61\x73\x2d\x6c\x6f\x63\x61\x6c\x2e\x73\x65\x74\x2d\x76\x61\x6c\x75\x65\x00\x32\x12\x61\x73\x2d\x6c\x6f\x63\x61\x6c\x2e\x74\x65\x65\x2d\x76\x61\x6c\x75\x65\x00\x33\x13\x61\x73\x2d\x67\x6c\x6f\x62\x61\x6c\x2e\x73\x65\x74\x2d\x76\x61\x6c\x75\x65\x00\x34\x0f\x61\x73\x2d\x6c\x6f\x61\x64\x2d\x6f\x70\x65\x72\x61\x6e\x64\x00\x35\x10\x61\x73\x2d\x75\x6e\x61\x72\x79\x2d\x6f\x70\x65\x72\x61\x6e\x64\x00\x38\x0e\x61\x73\x2d\x62\x69\x6e\x61\x72\x79\x2d\x6c\x65\x66\x74\x00\x39\x0f\x61\x73\x2d\x62\x69\x6e\x61\x72\x79\x2d\x72\x69\x67\x68\x74\x00\x3a\x0f\x61\x73\x2d\x74\x65\x73\x74\x2d\x6f\x70\x65\x72\x61\x6e\x64\x00\x3b\x0f\x61\x73\x2d\x63\x6f\x6d\x70\x61\x72\x65\x2d\x6c\x65\x66\x74\x00\x3c\x10\x61\x73\x2d\x63\x6f\x6d\x70\x61\x72\x65\x2d\x72\x69\x67\x68\x74\x00\x3d\x12\x61\x73\x2d\x63\x6f\x6e\x76\x65\x72\x74\x2d\x6f\x70\x65\x72\x61\x6e\x64\x00\x3e\x09\x87\x80\x80\x80\x00\x01\x00\x41\x00\x0b\x01\x28\x0a\x84\x87\x80\x80\x00\x3f\x85\x80\x80\x80\x00\x00\x41\xb2\x02\x0b\x85\x80\x80\x80\x00\x00\x42\xe4\x02\x0b\x87\x80\x80\x80\x00\x00\x43\x00\x20\x73\x45\x0b\x8b\x80\x80\x80\x00\x00\x44\x00\x00\x00\x00\x00\xc8\xae\x40\x0b\x84\x80\x80\x80\x00\x00\x20\x00\x0b\x84\x80\x80\x80\x00\x00\x20\x00\x0b\x84\x80\x80\x80\x00\x00\x20\x00\x0b\x84\x80\x80\x80\x00\x00\x20\x00\x0b\x84\x80\x80\x80\x00\x00\x20\x01\x0b\x84\x80\x80\x80\x00\x00\x20\x01\x0b\x84\x80\x80\x80\x00\x00\x20\x01\x0b\x84\x80\x80\x80\x00\x00\x20\x01\x0b\x84\x80\x80\x80\x00\x00\x10\x00\x0b\x84\x80\x80\x80\x00\x00\x10\x01\x0b\x84\x80\x80\x80\x00\x00\x10\x02\x0b\x84\x80\x80\x80\x00\x00\x10\x03\x0b\x86\x80\x80\x80\x00\x00\x41\x20\x10\x04\x0b\x87\x80\x80\x80\x00\x00\x42\xc0\x00\x10\x05\x0b\x89\x80\x80\x80\x00\x00\x43\xc3\xf5\xa8\x3f\x10\x06\x0b\x8d\x80\x80\x80\x00\x00\x44\x3d\x0a\xd7\xa3\x70\x3d\xfa\x3f\x10\x07\x0b\x8b\x80\x80\x80\x00\x00\x43\x66\x66\x00\x42\x41\x20\x10\x08\x0b\x89\x80\x80\x80\x00\x00\x41\x20\x42\xc0\x00\x10\x09\x0b\x92\x80\x80\x80\x00\x00\x44\x00\x00\x00\x00\x00\x00\x50\x40\x43\x00\x00\x00\x42\x10\x0a\x0b\x90\x80\x80\x80\x00\x00\x42\xc0\x00\x44\x66\x66\x66\x66\x66\x06\x50\x40\x10\x0b\x0b\x95\x80\x80\x80\x00\x00\x20\x00\x50\x04\x7e\x42\x01\x05\x20\x00\x20\x00\x42\x01\x7d\x10\x18\x7e\x0b\x0b\x97\x80\x80\x80\x00\x00\x20\x00\x50\x04\x7e\x20\x01\x05\x20\x00\x42\x01\x7d\x20\x00\x20\x01\x7e\x10\x19\x0b\x0b\x9c\x80\x80\x80\x00\x00\x20\x00\x42\x01\x58\x04\x7e\x42\x01\x05\x20\x00\x42\x02\x7d\x10\x1a\x20\x00\x42\x01\x7d\x10\x1a\x7c\x0b\x0b\x92\x80\x80\x80\x00\x00\x20\x00\x50\x04\x7f\x41\x2c\x05\x20\x00\x42\x01\x7d\x10\x1c\x0b\x0b\x93\x80\x80\x80\x00\x00\x20\x00\x50\x04\x7f\x41\xe3\x00\x05\x20\x00\x42\x01\x7d\x10\x1b\x0b\x0b\x84\x80\x80\x80\x00\x00\x10\x1d\x0b\x84\x80\x80\x80\x00\x00\x10\x1f\x0b\x84\x80\x80\x80\x00\x00\x10\x1e\x0b\x89\x80\x80\x80\x00\x00\x10\x00\x41\x02\x41\x03\x1b\x0b\x89\x80\x80\x80\x00\x00\x41\x02\x10\x00\x41\x03\x1b\x0b\x89\x80\x80\x80\x00\x00\x41\x02\x41\x03\x10\x00\x1b\x0b\x8c\x80\x80\x80\x00\x00\x10\x00\x04\x7f\x41\x01\x05\x41\x02\x0b\x0b\x8b\x80\x80\x80\x00\x00\x02\x7f\x10\x00\x41\x02\x0d\x00\x0b\x0b\x8b\x80\x80\x80\x00\x00\x02\x7f\x41\x02\x10\x00\x0d\x00\x0b\x0b\x8d\x80\x80\x80\x00\x00\x02\x7f\x10\x00\x41\x02\x0e\x01\x00\x00\x0b\x0b\x8d\x80\x80\x80\x00\x00\x02\x7f\x41\x02\x10\x00\x0e\x01\x00\x00\x0b\x0b\x84\x80\x80\x80\x00\x00\x20\x00\x0b\x8e\x80\x80\x80\x00\x00\x02\x7f\x10\x00\x41\x02\x41\x00\x11\x00\x00\x0b\x0b\x8e\x80\x80\x80\x00\x00\x02\x7f\x41\x02\x10\x00\x41\x00\x11\x00\x00\x0b\x0b\x8e\x80\x80\x80\x00\x00\x02\x7f\x41\x01\x41\x02\x10\x00\x11\x00\x00\x0b\x0b\x89\x80\x80\x80\x00\x00\x10\x00\x41\x01\x36\x02\x00\x0b\x89\x80\x80\x80\x00\x00\x41\x0a\x10\x00\x36\x02\x00\x0b\x86\x80\x80\x80\x00\x00\x10\x00\x40\x00\x0b\x85\x80\x80\x80\x00\x00\x10\x00\x0f\x0b\x85\x80\x80\x80\x00\x00\x10\x00\x1a\x0b\x89\x80\x80\x80\x00\x00\x02\x7f\x10\x00\x0c\x00\x0b\x0b\x8a\x80\x80\x80\x00\x01\x01\x7f\x10\x00\x21\x00\x20\x00\x0b\x88\x80\x80\x80\x00\x01\x01\x7f\x10\x00\x22\x00\x0b\x88\x80\x80\x80\x00\x00\x10\x00\x24\x00\x23\x00\x0b\x87\x80\x80\x80\x00\x00\x10\x00\x28\x02\x00\x0b\x84\x80\x80\x80\x00\x00\x20\x00\x0b\x84\x80\x80\x80\x00\x00\x20\x00\x0b\x8d\x80\x80\x80\x00\x00\x02\x7d\x43\x00\x00\x00\x00\x10\x37\x91\x0b\x0b\x8c\x80\x80\x80\x00\x00\x02\x7f\x41\x01\x10\x36\x41\x0a\x6a\x0b\x0b\x8c\x80\x80\x80\x00\x00\x02\x7f\x41\x0a\x41\x01\x10\x36\x6b\x0b\x0b\x8a\x80\x80\x80\x00\x00\x02\x7f\x41\x01\x10\x36\x45\x0b\x0b\x8c\x80\x80\x80\x00\x00\x02\x7f\x41\x01\x10\x36\x41\x0a\x4d\x0b\x0b\x8c\x80\x80\x80\x00\x00\x02\x7f\x41\x0a\x41\x01\x10\x36\x47\x0b\x0b\x8a\x80\x80\x80\x00\x00\x02\x7e\x41\x01\x10\x36\xac\x0b\x0b");

// call.wast:230
assert_return(() => call($1, "type-i32", []), 306);

// call.wast:231
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x8f\x80\x80\x80\x00\x01\x02\x24\x31\x08\x74\x79\x70\x65\x2d\x69\x36\x34\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x98\x80\x80\x80\x00\x01\x92\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\xe4\x02\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "type-i64", []), int64("356"))

// call.wast:232
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7d\x02\x8f\x80\x80\x80\x00\x01\x02\x24\x31\x08\x74\x79\x70\x65\x2d\x66\x33\x32\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9a\x80\x80\x80\x00\x01\x94\x80\x80\x80\x00\x00\x02\x40\x10\x00\xbc\x43\x00\x20\x73\x45\xbc\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "type-f32", []), 3890.)

// call.wast:233
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7c\x02\x8f\x80\x80\x80\x00\x01\x02\x24\x31\x08\x74\x79\x70\x65\x2d\x66\x36\x34\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9e\x80\x80\x80\x00\x01\x98\x80\x80\x80\x00\x00\x02\x40\x10\x00\xbd\x44\x00\x00\x00\x00\x00\xc8\xae\x40\xbd\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "type-f64", []), 3940.)

// call.wast:235
assert_return(() => call($1, "type-first-i32", []), 32);

// call.wast:236
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x95\x80\x80\x80\x00\x01\x02\x24\x31\x0e\x74\x79\x70\x65\x2d\x66\x69\x72\x73\x74\x2d\x69\x36\x34\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x98\x80\x80\x80\x00\x01\x92\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\xc0\x00\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "type-first-i64", []), int64("64"))

// call.wast:237
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7d\x02\x95\x80\x80\x80\x00\x01\x02\x24\x31\x0e\x74\x79\x70\x65\x2d\x66\x69\x72\x73\x74\x2d\x66\x33\x32\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9a\x80\x80\x80\x00\x01\x94\x80\x80\x80\x00\x00\x02\x40\x10\x00\xbc\x43\xc3\xf5\xa8\x3f\xbc\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "type-first-f32", []), 1.32000005245)

// call.wast:238
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7c\x02\x95\x80\x80\x80\x00\x01\x02\x24\x31\x0e\x74\x79\x70\x65\x2d\x66\x69\x72\x73\x74\x2d\x66\x36\x34\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9e\x80\x80\x80\x00\x01\x98\x80\x80\x80\x00\x00\x02\x40\x10\x00\xbd\x44\x3d\x0a\xd7\xa3\x70\x3d\xfa\x3f\xbd\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "type-first-f64", []), 1.64)

// call.wast:240
assert_return(() => call($1, "type-second-i32", []), 32);

// call.wast:241
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x96\x80\x80\x80\x00\x01\x02\x24\x31\x0f\x74\x79\x70\x65\x2d\x73\x65\x63\x6f\x6e\x64\x2d\x69\x36\x34\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x98\x80\x80\x80\x00\x01\x92\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\xc0\x00\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "type-second-i64", []), int64("64"))

// call.wast:242
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7d\x02\x96\x80\x80\x80\x00\x01\x02\x24\x31\x0f\x74\x79\x70\x65\x2d\x73\x65\x63\x6f\x6e\x64\x2d\x66\x33\x32\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9a\x80\x80\x80\x00\x01\x94\x80\x80\x80\x00\x00\x02\x40\x10\x00\xbc\x43\x00\x00\x00\x42\xbc\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "type-second-f32", []), 32.)

// call.wast:243
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7c\x02\x96\x80\x80\x80\x00\x01\x02\x24\x31\x0f\x74\x79\x70\x65\x2d\x73\x65\x63\x6f\x6e\x64\x2d\x66\x36\x34\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9e\x80\x80\x80\x00\x01\x98\x80\x80\x80\x00\x00\x02\x40\x10\x00\xbd\x44\x66\x66\x66\x66\x66\x06\x50\x40\xbd\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "type-second-f64", []), 64.1)

// call.wast:245
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7e\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x66\x61\x63\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x99\x80\x80\x80\x00\x01\x93\x80\x80\x80\x00\x00\x02\x40\x42\x00\x10\x00\x01\x42\x01\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fac", [int64("0")]), int64("1"))

// call.wast:246
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7e\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x66\x61\x63\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x99\x80\x80\x80\x00\x01\x93\x80\x80\x80\x00\x00\x02\x40\x42\x01\x10\x00\x01\x42\x01\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fac", [int64("1")]), int64("1"))

// call.wast:247
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7e\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x66\x61\x63\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9a\x80\x80\x80\x00\x01\x94\x80\x80\x80\x00\x00\x02\x40\x42\x05\x10\x00\x01\x42\xf8\x00\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fac", [int64("5")]), int64("120"))

// call.wast:248
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7e\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x66\x61\x63\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\xa2\x80\x80\x80\x00\x01\x9c\x80\x80\x80\x00\x00\x02\x40\x42\x19\x10\x00\x01\x42\x80\x80\x80\xde\x87\x92\xec\xcf\xe1\x00\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fac", [int64("25")]), int64("7_034_535_277_573_963_776"))

// call.wast:249
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x8a\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7e\x7e\x01\x7e\x02\x8e\x80\x80\x80\x00\x01\x02\x24\x31\x07\x66\x61\x63\x2d\x61\x63\x63\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9b\x80\x80\x80\x00\x01\x95\x80\x80\x80\x00\x00\x02\x40\x42\x00\x42\x01\x10\x00\x01\x42\x01\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fac-acc", [int64("0"), int64("1")]), int64("1"))

// call.wast:250
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x8a\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7e\x7e\x01\x7e\x02\x8e\x80\x80\x80\x00\x01\x02\x24\x31\x07\x66\x61\x63\x2d\x61\x63\x63\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9b\x80\x80\x80\x00\x01\x95\x80\x80\x80\x00\x00\x02\x40\x42\x01\x42\x01\x10\x00\x01\x42\x01\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fac-acc", [int64("1"), int64("1")]), int64("1"))

// call.wast:251
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x8a\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7e\x7e\x01\x7e\x02\x8e\x80\x80\x80\x00\x01\x02\x24\x31\x07\x66\x61\x63\x2d\x61\x63\x63\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9c\x80\x80\x80\x00\x01\x96\x80\x80\x80\x00\x00\x02\x40\x42\x05\x42\x01\x10\x00\x01\x42\xf8\x00\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fac-acc", [int64("5"), int64("1")]), int64("120"))

// call.wast:252
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x8a\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7e\x7e\x01\x7e\x02\x8e\x80\x80\x80\x00\x01\x02\x24\x31\x07\x66\x61\x63\x2d\x61\x63\x63\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\xa4\x80\x80\x80\x00\x01\x9e\x80\x80\x80\x00\x00\x02\x40\x42\x19\x42\x01\x10\x00\x01\x42\x80\x80\x80\xde\x87\x92\xec\xcf\xe1\x00\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fac-acc", [int64("25"), int64("1")]), int64("7_034_535_277_573_963_776"))

// call.wast:257
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7e\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x66\x69\x62\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x99\x80\x80\x80\x00\x01\x93\x80\x80\x80\x00\x00\x02\x40\x42\x00\x10\x00\x01\x42\x01\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fib", [int64("0")]), int64("1"))

// call.wast:258
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7e\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x66\x69\x62\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x99\x80\x80\x80\x00\x01\x93\x80\x80\x80\x00\x00\x02\x40\x42\x01\x10\x00\x01\x42\x01\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fib", [int64("1")]), int64("1"))

// call.wast:259
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7e\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x66\x69\x62\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x99\x80\x80\x80\x00\x01\x93\x80\x80\x80\x00\x00\x02\x40\x42\x02\x10\x00\x01\x42\x02\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fib", [int64("2")]), int64("2"))

// call.wast:260
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7e\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x66\x69\x62\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x99\x80\x80\x80\x00\x01\x93\x80\x80\x80\x00\x00\x02\x40\x42\x05\x10\x00\x01\x42\x08\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fib", [int64("5")]), int64("8"))

// call.wast:261
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7e\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x66\x69\x62\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9b\x80\x80\x80\x00\x01\x95\x80\x80\x80\x00\x00\x02\x40\x42\x14\x10\x00\x01\x42\xc2\xd5\x00\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "fib", [int64("20")]), int64("10_946"))

// call.wast:263
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7f\x02\x8b\x80\x80\x80\x00\x01\x02\x24\x31\x04\x65\x76\x65\x6e\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x99\x80\x80\x80\x00\x01\x93\x80\x80\x80\x00\x00\x02\x40\x42\x00\x10\x00\x01\x41\x2c\x01\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "even", [int64("0")]), 44)

// call.wast:264
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7f\x02\x8b\x80\x80\x80\x00\x01\x02\x24\x31\x04\x65\x76\x65\x6e\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9a\x80\x80\x80\x00\x01\x94\x80\x80\x80\x00\x00\x02\x40\x42\x01\x10\x00\x01\x41\xe3\x00\x01\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "even", [int64("1")]), 99)

// call.wast:265
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7f\x02\x8b\x80\x80\x80\x00\x01\x02\x24\x31\x04\x65\x76\x65\x6e\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9a\x80\x80\x80\x00\x01\x94\x80\x80\x80\x00\x00\x02\x40\x42\xe4\x00\x10\x00\x01\x41\x2c\x01\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "even", [int64("100")]), 44)

// call.wast:266
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7f\x02\x8b\x80\x80\x80\x00\x01\x02\x24\x31\x04\x65\x76\x65\x6e\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9b\x80\x80\x80\x00\x01\x95\x80\x80\x80\x00\x00\x02\x40\x42\xcd\x00\x10\x00\x01\x41\xe3\x00\x01\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "even", [int64("77")]), 99)

// call.wast:267
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7f\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x6f\x64\x64\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9a\x80\x80\x80\x00\x01\x94\x80\x80\x80\x00\x00\x02\x40\x42\x00\x10\x00\x01\x41\xe3\x00\x01\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "odd", [int64("0")]), 99)

// call.wast:268
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7f\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x6f\x64\x64\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x99\x80\x80\x80\x00\x01\x93\x80\x80\x80\x00\x00\x02\x40\x42\x01\x10\x00\x01\x41\x2c\x01\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "odd", [int64("1")]), 44)

// call.wast:269
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7f\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x6f\x64\x64\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9b\x80\x80\x80\x00\x01\x95\x80\x80\x80\x00\x00\x02\x40\x42\xc8\x01\x10\x00\x01\x41\xe3\x00\x01\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "odd", [int64("200")]), 99)

// call.wast:270
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7e\x01\x7f\x02\x8a\x80\x80\x80\x00\x01\x02\x24\x31\x03\x6f\x64\x64\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9a\x80\x80\x80\x00\x01\x94\x80\x80\x80\x00\x00\x02\x40\x42\xcd\x00\x10\x00\x01\x41\x2c\x01\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "odd", [int64("77")]), 44)

// call.wast:272
assert_exhaustion(() => call($1, "runaway", []));

// call.wast:273
assert_exhaustion(() => call($1, "mutual-runaway", []));

// call.wast:275
assert_return(() => call($1, "as-select-first", []), 306);

// call.wast:276
assert_return(() => call($1, "as-select-mid", []), 2);

// call.wast:277
assert_return(() => call($1, "as-select-last", []), 2);

// call.wast:279
assert_return(() => call($1, "as-if-condition", []), 1);

// call.wast:281
assert_return(() => call($1, "as-br_if-first", []), 306);

// call.wast:282
assert_return(() => call($1, "as-br_if-last", []), 2);

// call.wast:284
assert_return(() => call($1, "as-br_table-first", []), 306);

// call.wast:285
assert_return(() => call($1, "as-br_table-last", []), 2);

// call.wast:287
assert_return(() => call($1, "as-call_indirect-first", []), 306);

// call.wast:288
assert_return(() => call($1, "as-call_indirect-mid", []), 2);

// call.wast:289
assert_trap(() => call($1, "as-call_indirect-last", []));

// call.wast:291
assert_return(() => call($1, "as-store-first", []));

// call.wast:292
assert_return(() => call($1, "as-store-last", []));

// call.wast:294
assert_return(() => call($1, "as-memory.grow-value", []), 1);

// call.wast:295
assert_return(() => call($1, "as-return-value", []), 306);

// call.wast:296
assert_return(() => call($1, "as-drop-operand", []));

// call.wast:297
assert_return(() => call($1, "as-br-value", []), 306);

// call.wast:298
assert_return(() => call($1, "as-local.set-value", []), 306);

// call.wast:299
assert_return(() => call($1, "as-local.tee-value", []), 306);

// call.wast:300
assert_return(() => call($1, "as-global.set-value", []), 306);

// call.wast:301
assert_return(() => call($1, "as-load-operand", []), 1);

// call.wast:303
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7d\x02\x97\x80\x80\x80\x00\x01\x02\x24\x31\x10\x61\x73\x2d\x75\x6e\x61\x72\x79\x2d\x6f\x70\x65\x72\x61\x6e\x64\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x9a\x80\x80\x80\x00\x01\x94\x80\x80\x80\x00\x00\x02\x40\x10\x00\xbc\x43\x00\x00\x00\x00\xbc\x46\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "as-unary-operand", []), 0.)

// call.wast:304
assert_return(() => call($1, "as-binary-left", []), 11);

// call.wast:305
assert_return(() => call($1, "as-binary-right", []), 9);

// call.wast:306
assert_return(() => call($1, "as-test-operand", []), 0);

// call.wast:307
assert_return(() => call($1, "as-compare-left", []), 1);

// call.wast:308
assert_return(() => call($1, "as-compare-right", []), 1);

// call.wast:309
run(() => call(instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x02\x99\x80\x80\x80\x00\x01\x02\x24\x31\x12\x61\x73\x2d\x63\x6f\x6e\x76\x65\x72\x74\x2d\x6f\x70\x65\x72\x61\x6e\x64\x00\x01\x03\x82\x80\x80\x80\x00\x01\x00\x07\x87\x80\x80\x80\x00\x01\x03\x72\x75\x6e\x00\x01\x0a\x97\x80\x80\x80\x00\x01\x91\x80\x80\x80\x00\x00\x02\x40\x10\x00\x01\x42\x01\x01\x51\x45\x0d\x00\x0f\x0b\x00\x0b", exports("$1", $1)),  "run", []));  // assert_return(() => call($1, "as-convert-operand", []), int64("1"))

// call.wast:313
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x84\x80\x80\x80\x00\x01\x60\x00\x00\x03\x83\x80\x80\x80\x00\x02\x00\x00\x0a\x92\x80\x80\x80\x00\x02\x85\x80\x80\x80\x00\x00\x10\x01\x45\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:320
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x00\x01\x7e\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x94\x80\x80\x80\x00\x02\x85\x80\x80\x80\x00\x00\x10\x01\x45\x0b\x84\x80\x80\x80\x00\x00\x42\x01\x0b");

// call.wast:328
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7f\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x91\x80\x80\x80\x00\x02\x84\x80\x80\x80\x00\x00\x10\x01\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:335
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7c\x7f\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x91\x80\x80\x80\x00\x02\x84\x80\x80\x80\x00\x00\x10\x01\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:342
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x84\x80\x80\x80\x00\x01\x60\x00\x00\x03\x83\x80\x80\x80\x00\x02\x00\x00\x0a\x93\x80\x80\x80\x00\x02\x86\x80\x80\x80\x00\x00\x41\x01\x10\x01\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:349
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x84\x80\x80\x80\x00\x01\x60\x00\x00\x03\x83\x80\x80\x80\x00\x02\x00\x00\x0a\x9c\x80\x80\x80\x00\x02\x8f\x80\x80\x80\x00\x00\x44\x00\x00\x00\x00\x00\x00\x00\x40\x41\x01\x10\x01\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:357
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7f\x7f\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x94\x80\x80\x80\x00\x02\x87\x80\x80\x80\x00\x00\x01\x41\x01\x10\x01\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:364
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7f\x7f\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x94\x80\x80\x80\x00\x02\x87\x80\x80\x80\x00\x00\x41\x01\x01\x10\x01\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:371
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7f\x7c\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x9c\x80\x80\x80\x00\x02\x8f\x80\x80\x80\x00\x00\x44\x00\x00\x00\x00\x00\x00\xf0\x3f\x41\x01\x10\x01\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:378
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7c\x7f\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x9c\x80\x80\x80\x00\x02\x8f\x80\x80\x80\x00\x00\x41\x01\x44\x00\x00\x00\x00\x00\x00\xf0\x3f\x10\x01\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:386
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7f\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x94\x80\x80\x80\x00\x02\x87\x80\x80\x80\x00\x00\x02\x40\x10\x01\x0b\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:395
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7f\x7f\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x96\x80\x80\x80\x00\x02\x89\x80\x80\x80\x00\x00\x02\x40\x41\x00\x10\x01\x0b\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:404
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7f\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x94\x80\x80\x80\x00\x02\x87\x80\x80\x80\x00\x00\x03\x40\x10\x01\x0b\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:413
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7f\x7f\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x96\x80\x80\x80\x00\x02\x89\x80\x80\x80\x00\x00\x03\x40\x41\x00\x10\x01\x0b\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:422
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x88\x80\x80\x80\x00\x02\x60\x00\x00\x60\x01\x7f\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x96\x80\x80\x80\x00\x02\x89\x80\x80\x80\x00\x00\x41\x00\x04\x40\x10\x01\x0b\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:431
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x89\x80\x80\x80\x00\x02\x60\x00\x00\x60\x02\x7f\x7f\x00\x03\x83\x80\x80\x80\x00\x02\x00\x01\x0a\x98\x80\x80\x80\x00\x02\x8b\x80\x80\x80\x00\x00\x41\x00\x04\x40\x41\x00\x10\x01\x0b\x0b\x82\x80\x80\x80\x00\x00\x0b");

// call.wast:444
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x84\x80\x80\x80\x00\x01\x60\x00\x00\x03\x82\x80\x80\x80\x00\x01\x00\x0a\x8a\x80\x80\x80\x00\x01\x84\x80\x80\x80\x00\x00\x10\x01\x0b");

// call.wast:448
assert_invalid("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x84\x80\x80\x80\x00\x01\x60\x00\x00\x03\x82\x80\x80\x80\x00\x01\x00\x0a\x8e\x80\x80\x80\x00\x01\x88\x80\x80\x80\x00\x00\x10\x94\x98\xdb\xe2\x03\x0b");
