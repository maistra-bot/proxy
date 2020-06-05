
_GENRULE_CMD = {"@envoy//bazel/external:wee8.genrule_cmd": "#!/bin/bash\n\nset -e\n\n# This works only on Linux-{x86_64,ppc64le,s390x,aarch64} and macOS-x86_64.\ncase \"$$(uname -s)-$$(uname -m)\" in\nLinux-x86_64|Linux-ppc64le|Linux-s390x|Linux-aarch64|Darwin-x86_64)\n  ;;\n*)\n  echo \"ERROR: wee8 is currently supported only on Linux-{x86_64,ppc64le,s390x,aarch64} and macOS-x86_64.\" >&2\n  exit 1\nesac\n\n# Bazel magic.\nROOT=$$(dirname $(rootpath wee8/BUILD.gn))/..\npushd $$ROOT/wee8\n\n# Clean after previous build.\nrm -rf out/wee8\n\n# Export compiler configuration.\nif [[ ( `uname` == \"Darwin\" && $${CXX-} == \"\" ) || $${CXX-} == *\"clang\"* ]]; then\n  export IS_CLANG=true\n  export CC=$${CC:-clang}\n  export CXX=$${CXX:-clang++}\nelse\n  export IS_CLANG=false\n  export CC=$${CC:-gcc}\n  export CXX=$${CXX:-g++}\nfi\n\nexport AR=$${AR:-ar}\nexport NM=$${NM:-nm}\n\n# Hook sanitizers.\nif [[ $${ENVOY_ASAN-} == \"1\" ]]; then\n  WEE8_BUILD_ARGS+=\" is_asan=true\"\n  WEE8_BUILD_ARGS+=\" is_lsan=true\"\nfi\nif [[ $${ENVOY_MSAN-} == \"1\" ]]; then\n  WEE8_BUILD_ARGS+=\" is_msan=true\"\nfi\nif [[ $${ENVOY_TSAN-} == \"1\" ]]; then\n  WEE8_BUILD_ARGS+=\" is_tsan=true\"\nfi\n\n# Release build.\nWEE8_BUILD_ARGS+=\" is_debug=false\"\n# Clang or not Clang, that is the question.\nWEE8_BUILD_ARGS+=\" is_clang=$$IS_CLANG\"\n# Hack to disable bleeding-edge compiler flags.\nWEE8_BUILD_ARGS+=\" use_xcode_clang=true\"\n# Use local toolchain.\nWEE8_BUILD_ARGS+=\" custom_toolchain=\\\"//build/toolchain/linux/unbundle:default\\\"\"\n# Use local stdlibc++ / libc++.\nWEE8_BUILD_ARGS+=\" use_custom_libcxx=false\"\n# Use local sysroot.\nWEE8_BUILD_ARGS+=\" use_sysroot=false\"\n# Disable unused GLib2 dependency.\nWEE8_BUILD_ARGS+=\" use_glib=false\"\n# Expose debug symbols.\nWEE8_BUILD_ARGS+=\" v8_expose_symbols=true\"\n# Build monolithic library.\nWEE8_BUILD_ARGS+=\" is_component_build=false\"\nWEE8_BUILD_ARGS+=\" v8_enable_i18n_support=false\"\nWEE8_BUILD_ARGS+=\" v8_enable_gdbjit=false\"\nWEE8_BUILD_ARGS+=\" v8_use_external_startup_data=false\"\n# Disable read-only heap, since it's leaky and HEAPCHECK complains about it.\n# TODO(PiotrSikora): remove when fixed upstream.\nWEE8_BUILD_ARGS+=\" v8_enable_shared_ro_heap=false\"\n\n# Build wee8.\nthird_party/depot_tools/gn gen out/wee8 --args=\"$$WEE8_BUILD_ARGS\"\nninja -C out/wee8 wee8\n\n# Move compiled library to the expected destinations.\npopd\nmv $$ROOT/wee8/out/wee8/obj/libwee8.a $(execpath libwee8.a)\n"}
def genrule_cmd(label):
    return _GENRULE_CMD[label]
