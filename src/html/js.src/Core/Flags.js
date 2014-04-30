
var HVF_SYSTEM_64BIT = 1; 
var HVF_DEPLOYMENT_HDD = 2; 
var HVF_GUEST_ADDITIONS = 4;
var HVF_FLOPPY_IO = 8;

/**
 * User-friendly interface to flags
 */
var parseSessionFlags = function( o ) {
    var val=0;
    if (o.use64bit) val |= HVF_SYSTEM_64BIT;
    if (o.useBootDisk) val |= HVF_DEPLOYMENT_HDD;
    if (o.useGuestAdditions) val |= HVF_GUEST_ADDITIONS;
    if (o.useFloppyIO) val |= HVF_FLOPPY_IO;
    if (o.HVF_HEADFUL) val |= HVF_HEADFUL;
    return val;
};
var SessionFlags = function( o ) {
    var vSet = function(v) { o.__config['flags']=v; o.setAsync("flags", v); },
        vGet = function()  { return o.__config['flags']; };
    Object.defineProperties(this, {
        
        /* If the value is updated, trigger callback */
        "value":    {   get: function() {
                            return vGet();
                        },
                        set: function(v) {
                            vSet(v);
                        }
                    },
                    
        /* HVF_SYSTEM_64BIT: Use 64 bit CPU */
        "use64bit": {   get: function () { 
                            return ((vGet() & HVF_SYSTEM_64BIT) != 0);
                        },
                        set: function(v) {
                            if (v) {
                                vSet( vGet() | HVF_SYSTEM_64BIT );
                            } else {
                                vSet( vGet() & ~HVF_SYSTEM_64BIT );
                            }
                        }
                    },
                    
        /* HVF_DEPLOYMENT_HDD: Use a bootable disk (specified by diskURL) instead of using micro-CernVM */
        "useBootDisk":{  get: function () { 
                            return ((vGet() & HVF_DEPLOYMENT_HDD) != 0);
                        },
                        set: function(v) {
                            if (v) {
                                vSet( vGet() | HVF_DEPLOYMENT_HDD );
                            } else {
                                vSet( vGet() & ~HVF_DEPLOYMENT_HDD );
                            }
                        }
                    },

        /* HVF_GUEST_ADDITIONS: Attach guest additions CD-ROM at boot */
        "useGuestAdditions":{  get: function () { 
                            return ((vGet() & HVF_GUEST_ADDITIONS) != 0);
                        },
                        set: function(v) {
                            if (v) {
                                vSet( vGet() | HVF_GUEST_ADDITIONS );
                            } else {
                                vSet( vGet() & ~HVF_GUEST_ADDITIONS );
                            }
                        }
                    },

        /* HVF_FLOPPY_IO: Use FloppyIO contextualization instead of CD-ROM contextualization */
        "useFloppyIO":{  get: function () { 
                            return ((vGet() & HVF_FLOPPY_IO) != 0);
                        },
                        set: function(v) {
                            if (v) {
                                vSet( vGet() | HVF_FLOPPY_IO );
                            } else {
                                vSet( vGet() & ~HVF_FLOPPY_IO );
                            }
                        }
                    },
        
        /* HVF_HEADFUL: Use GUI window instead of headless */
        "headful": {  get: function () { 
                            return ((vGet() & HVF_HEADFUL) != 0);
                        },
                        set: function(v) {
                            if (v) {
                                vSet( vGet() | HVF_HEADFUL );
                            } else {
                                vSet( vGet() & ~HVF_HEADFUL );
                            }
                        }
                    }

    });
};
