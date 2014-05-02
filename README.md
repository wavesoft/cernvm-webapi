cernvm-webapi
=============

CernVM WebAPI Based on URI-Handlers

Migration from 1.x
==================

 * The ```CVM.requestSession``` function does not accept the third parameter any more
 * The session state codes have changed
 * The event ```sessionStateChanged``` is renamed to ```stateChanged```
 * The following events are removed: ```error```, ```open```, ```openError```, ```started```, ```startedError``` 
 * The event ```apiAvailable``` and ```apiUnavailable``` replaced with event ```apiStateChanged```
 