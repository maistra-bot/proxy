# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: policy/v1beta1/value_type.proto

import sys
_b=sys.version_info[0]<3 and (lambda x:x) or (lambda x:x.encode('latin1'))
from google.protobuf.internal import enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from google.protobuf import reflection as _reflection
from google.protobuf import symbol_database as _symbol_database
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor.FileDescriptor(
  name='policy/v1beta1/value_type.proto',
  package='istio.policy.v1beta1',
  syntax='proto3',
  serialized_options=_b('Z\033istio.io/api/policy/v1beta1'),
  serialized_pb=_b('\n\x1fpolicy/v1beta1/value_type.proto\x12\x14istio.policy.v1beta1*\xbb\x01\n\tValueType\x12\x1a\n\x16VALUE_TYPE_UNSPECIFIED\x10\x00\x12\n\n\x06STRING\x10\x01\x12\t\n\x05INT64\x10\x02\x12\n\n\x06\x44OUBLE\x10\x03\x12\x08\n\x04\x42OOL\x10\x04\x12\r\n\tTIMESTAMP\x10\x05\x12\x0e\n\nIP_ADDRESS\x10\x06\x12\x11\n\rEMAIL_ADDRESS\x10\x07\x12\x07\n\x03URI\x10\x08\x12\x0c\n\x08\x44NS_NAME\x10\t\x12\x0c\n\x08\x44URATION\x10\n\x12\x0e\n\nSTRING_MAP\x10\x0b\x42\x1dZ\x1bistio.io/api/policy/v1beta1b\x06proto3')
)

_VALUETYPE = _descriptor.EnumDescriptor(
  name='ValueType',
  full_name='istio.policy.v1beta1.ValueType',
  filename=None,
  file=DESCRIPTOR,
  values=[
    _descriptor.EnumValueDescriptor(
      name='VALUE_TYPE_UNSPECIFIED', index=0, number=0,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='STRING', index=1, number=1,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='INT64', index=2, number=2,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='DOUBLE', index=3, number=3,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='BOOL', index=4, number=4,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='TIMESTAMP', index=5, number=5,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='IP_ADDRESS', index=6, number=6,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='EMAIL_ADDRESS', index=7, number=7,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='URI', index=8, number=8,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='DNS_NAME', index=9, number=9,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='DURATION', index=10, number=10,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='STRING_MAP', index=11, number=11,
      serialized_options=None,
      type=None),
  ],
  containing_type=None,
  serialized_options=None,
  serialized_start=58,
  serialized_end=245,
)
_sym_db.RegisterEnumDescriptor(_VALUETYPE)

ValueType = enum_type_wrapper.EnumTypeWrapper(_VALUETYPE)
VALUE_TYPE_UNSPECIFIED = 0
STRING = 1
INT64 = 2
DOUBLE = 3
BOOL = 4
TIMESTAMP = 5
IP_ADDRESS = 6
EMAIL_ADDRESS = 7
URI = 8
DNS_NAME = 9
DURATION = 10
STRING_MAP = 11


DESCRIPTOR.enum_types_by_name['ValueType'] = _VALUETYPE
_sym_db.RegisterFileDescriptor(DESCRIPTOR)


DESCRIPTOR._options = None
# @@protoc_insertion_point(module_scope)
