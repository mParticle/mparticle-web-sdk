## Releases
--
#### 1.1.0 (April 14, 2017)
*  Fixed bug where calling setUserIdentity with a similar type added another identity, rather than replacing the identity.
*  Calling setUserIdentity with `id = null` and valid type will remove the user identity of that type
*  Include CommerceEvent custom attributions in expansion; makes a copy of the original commerce event rather than referencing it, which would mutate it
