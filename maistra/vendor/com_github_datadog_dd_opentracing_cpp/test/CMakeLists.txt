add_library(catch STATIC test_main.cpp)

macro(_datadog_test TEST_NAME)
  add_executable(${TEST_NAME} ${ARGN})
  add_sanitizers(${TEST_NAME})  
  target_link_libraries(${TEST_NAME} ${DATADOG_LINK_LIBRARIES}
                                     dd_opentracing
                                     catch)
  add_test(${TEST_NAME} ${TEST_NAME})
endmacro()

_datadog_test(agent_writer_test agent_writer_test.cpp)
_datadog_test(opentracing_test opentracing_test.cpp)
_datadog_test(propagation_test propagation_test.cpp)
_datadog_test(sample_test sample_test.cpp)
_datadog_test(span_buffer_test span_buffer_test.cpp)
_datadog_test(span_test span_test.cpp)
_datadog_test(tracer_factory_test tracer_factory_test.cpp)
_datadog_test(tracer_options_test tracer_options_test.cpp)
_datadog_test(tracer_test tracer_test.cpp)
