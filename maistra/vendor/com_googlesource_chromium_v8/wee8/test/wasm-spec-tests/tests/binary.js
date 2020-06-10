
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

// binary.wast:1
let $1 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00");

// binary.wast:2
let $2 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00");

// binary.wast:3
let $3 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00");
let $M1 = $3;

// binary.wast:4
let $4 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00");
let $M2 = $4;

// binary.wast:6
assert_malformed("");

// binary.wast:7
assert_malformed("\x01");

// binary.wast:8
assert_malformed("\x00\x61\x73");

// binary.wast:9
assert_malformed("\x61\x73\x6d\x00");

// binary.wast:10
assert_malformed("\x6d\x73\x61\x00");

// binary.wast:11
assert_malformed("\x6d\x73\x61\x00\x01\x00\x00\x00");

// binary.wast:12
assert_malformed("\x6d\x73\x61\x00\x00\x00\x00\x01");

// binary.wast:13
assert_malformed("\x61\x73\x6d\x01\x00\x00\x00\x00");

// binary.wast:14
assert_malformed("\x77\x61\x73\x6d\x01\x00\x00\x00");

// binary.wast:15
assert_malformed("\x7f\x61\x73\x6d\x01\x00\x00\x00");

// binary.wast:16
assert_malformed("\x80\x61\x73\x6d\x01\x00\x00\x00");

// binary.wast:17
assert_malformed("\x82\x61\x73\x6d\x01\x00\x00\x00");

// binary.wast:18
assert_malformed("\xff\x61\x73\x6d\x01\x00\x00\x00");

// binary.wast:21
assert_malformed("\x00\x00\x00\x01\x6d\x73\x61\x00");

// binary.wast:24
assert_malformed("\x61\x00\x6d\x73\x00\x01\x00\x00");

// binary.wast:25
assert_malformed("\x73\x6d\x00\x61\x00\x00\x01\x00");

// binary.wast:28
assert_malformed("\x00\x41\x53\x4d\x01\x00\x00\x00");

// binary.wast:31
assert_malformed("\x00\x81\xa2\x94\x01\x00\x00\x00");

// binary.wast:34
assert_malformed("\xef\xbb\xbf\x00\x61\x73\x6d\x01\x00\x00\x00");

// binary.wast:37
assert_malformed("\x00\x61\x73\x6d");

// binary.wast:38
assert_malformed("\x00\x61\x73\x6d\x01");

// binary.wast:39
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00");

// binary.wast:40
assert_malformed("\x00\x61\x73\x6d\x00\x00\x00\x00");

// binary.wast:41
assert_malformed("\x00\x61\x73\x6d\x0d\x00\x00\x00");

// binary.wast:42
assert_malformed("\x00\x61\x73\x6d\x0e\x00\x00\x00");

// binary.wast:43
assert_malformed("\x00\x61\x73\x6d\x00\x01\x00\x00");

// binary.wast:44
assert_malformed("\x00\x61\x73\x6d\x00\x00\x01\x00");

// binary.wast:45
assert_malformed("\x00\x61\x73\x6d\x00\x00\x00\x01");

// binary.wast:49
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x04\x04\x01\x70\x00\x00\x0a\x09\x01\x07\x00\x41\x00\x11\x00\x01\x0b");

// binary.wast:68
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x04\x04\x01\x70\x00\x00\x0a\x0a\x01\x07\x00\x41\x00\x11\x00\x80\x00\x0b");

// binary.wast:87
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x04\x04\x01\x70\x00\x00\x0a\x0b\x01\x08\x00\x41\x00\x11\x00\x80\x80\x00\x0b");

// binary.wast:105
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x04\x04\x01\x70\x00\x00\x0a\x0c\x01\x09\x00\x41\x00\x11\x00\x80\x80\x80\x00\x0b");

// binary.wast:123
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x04\x04\x01\x70\x00\x00\x0a\x0d\x01\x0a\x00\x41\x00\x11\x00\x80\x80\x80\x80\x00\x0b");

// binary.wast:142
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x05\x03\x01\x00\x00\x0a\x09\x01\x07\x00\x41\x00\x40\x01\x1a\x0b");

// binary.wast:162
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x05\x03\x01\x00\x00\x0a\x0a\x01\x08\x00\x41\x00\x40\x80\x00\x1a\x0b");

// binary.wast:182
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x05\x03\x01\x00\x00\x0a\x0b\x01\x09\x00\x41\x00\x40\x80\x80\x00\x1a\x0b");

// binary.wast:201
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x05\x03\x01\x00\x00\x0a\x0c\x01\x0a\x00\x41\x00\x40\x80\x80\x80\x00\x1a\x0b");

// binary.wast:220
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x05\x03\x01\x00\x00\x0a\x0d\x01\x0b\x00\x41\x00\x40\x80\x80\x80\x80\x00\x1a\x0b");

// binary.wast:240
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x05\x03\x01\x00\x00\x0a\x07\x01\x05\x00\x3f\x01\x1a\x0b");

// binary.wast:259
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x05\x03\x01\x00\x00\x0a\x08\x01\x06\x00\x3f\x80\x00\x1a\x0b");

// binary.wast:278
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x05\x03\x01\x00\x00\x0a\x09\x01\x07\x00\x3f\x80\x80\x00\x1a\x0b");

// binary.wast:296
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x05\x03\x01\x00\x00\x0a\x0a\x01\x08\x00\x3f\x80\x80\x80\x00\x1a\x0b");

// binary.wast:314
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x05\x03\x01\x00\x00\x0a\x0b\x01\x09\x00\x3f\x80\x80\x80\x80\x00\x1a\x0b");

// binary.wast:333
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x0a\x0c\x01\x0a\x02\xff\xff\xff\xff\x0f\x7f\x02\x7e\x0b");

// binary.wast:350
let $5 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x0a\x0a\x01\x08\x03\x00\x7f\x00\x7e\x02\x7d\x0b");

// binary.wast:365
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x03\x02\x00\x00");

// binary.wast:375
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x0a\x04\x01\x02\x00\x0b");

// binary.wast:384
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x03\x02\x00\x00\x0a\x04\x01\x02\x00\x0b");

// binary.wast:395
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x0a\x07\x02\x02\x00\x0b\x02\x00\x0b");

// binary.wast:406
let $6 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x03\x01\x00");

// binary.wast:412
let $7 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x0a\x01\x00");

// binary.wast:418
let $8 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x01\x00");

// binary.wast:424
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x07\x02\x60\x00\x00");

// binary.wast:435
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x07\x01\x60\x00\x00\x60\x00\x00");

// binary.wast:446
let $9 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x05\x01\x60\x01\x7f\x00\x02\x01\x00");

// binary.wast:454
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x05\x01\x60\x01\x7f\x00\x02\x16\x02\x08\x73\x70\x65\x63\x74\x65\x73\x74\x09\x70\x72\x69\x6e\x74\x5f\x69\x33\x32\x00\x00");

// binary.wast:473
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x09\x02\x60\x01\x7f\x00\x60\x01\x7d\x00\x02\x2b\x01\x08\x73\x70\x65\x63\x74\x65\x73\x74\x09\x70\x72\x69\x6e\x74\x5f\x69\x33\x32\x00\x00\x08\x73\x70\x65\x63\x74\x65\x73\x74\x09\x70\x72\x69\x6e\x74\x5f\x66\x33\x32\x00\x01");

// binary.wast:498
let $10 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x04\x01\x00");

// binary.wast:504
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x04\x01\x01");

// binary.wast:514
let $11 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x05\x01\x00");

// binary.wast:520
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x05\x01\x01");

// binary.wast:530
let $12 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x06\x01\x00");

// binary.wast:536
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x06\x06\x02\x7f\x00\x41\x00\x0b");

// binary.wast:547
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x06\x0b\x01\x7f\x00\x41\x00\x0b\x7f\x00\x41\x00\x0b");

// binary.wast:558
let $13 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x03\x02\x00\x00\x07\x01\x00\x0a\x07\x02\x02\x00\x0b\x02\x00\x0b");

// binary.wast:570
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x03\x02\x00\x00\x07\x06\x02\x02\x66\x31\x00\x00\x0a\x07\x02\x02\x00\x0b\x02\x00\x0b");

// binary.wast:591
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x03\x02\x00\x00\x07\x0b\x01\x02\x66\x31\x00\x00\x02\x66\x32\x00\x01\x0a\x07\x02\x02\x00\x0b\x02\x00\x0b");

// binary.wast:612
let $14 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x04\x04\x01\x70\x00\x01\x09\x01\x00\x0a\x04\x01\x02\x00\x0b");

// binary.wast:625
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x04\x04\x01\x70\x00\x01\x09\x07\x02\x00\x41\x00\x0b\x01\x00\x0a\x04\x01\x02\x00\x0b");

// binary.wast:643
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x04\x04\x01\x70\x00\x01\x09\x0d\x01\x00\x41\x00\x0b\x01\x00\x00\x41\x00\x0b\x01\x00\x0a\x04\x01\x02\x00\x0b");

// binary.wast:661
let $15 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x05\x03\x01\x00\x01\x0b\x01\x00");

// binary.wast:669
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x05\x03\x01\x00\x01\x0b\x07\x02\x00\x41\x00\x0b\x01\x61");

// binary.wast:682
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x05\x03\x01\x00\x01\x0b\x0d\x01\x00\x41\x00\x0b\x01\x61\x00\x41\x01\x0b\x01\x62");

// binary.wast:695
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x05\x03\x01\x00\x01\x0b\x0c\x01\x00\x41\x03\x0b\x07\x61\x62\x63\x64\x65\x66");

// binary.wast:709
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x05\x03\x01\x00\x01\x0b\x0c\x01\x00\x41\x00\x0b\x05\x61\x62\x63\x64\x65\x66");

// binary.wast:723
let $16 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x0a\x11\x01\x0f\x00\x02\x40\x41\x01\x04\x40\x41\x01\x0e\x00\x02\x0b\x0b\x0b");

// binary.wast:740
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x0a\x12\x01\x10\x00\x02\x40\x41\x01\x04\x40\x41\x01\x0e\x02\x00\x02\x0b\x0b\x0b");

// binary.wast:762
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x0a\x12\x01\x11\x00\x02\x40\x41\x01\x04\x40\x41\x01\x0e\x01\x00\x01\x02\x0b\x0b\x0b");

// binary.wast:784
let $17 = instance("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x08\x01\x00\x0a\x04\x01\x02\x00\x0b");

// binary.wast:797
assert_malformed("\x00\x61\x73\x6d\x01\x00\x00\x00\x01\x04\x01\x60\x00\x00\x03\x02\x01\x00\x08\x01\x00\x08\x01\x00\x0a\x04\x01\x02\x00\x0b");
