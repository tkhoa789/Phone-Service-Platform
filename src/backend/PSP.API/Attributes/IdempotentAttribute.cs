using System;

namespace PSP.API.Attributes;

[AttributeUsage(AttributeTargets.Method, Inherited = false, AllowMultiple = false)]
public class IdempotentAttribute : Attribute
{
}
