function CbPromise(executor){

    CbPromise.PENDING = 'pending';
    CbPromise.FULFILLED = 'fulfilled';
    CbPromise.REJECTED = 'rejected';
    this.value = null;
    this.status = CbPromise.PENDING;
    let self = this;
    this.taskQueue = [];

    function isFunc(value){
        if(typeof value === 'function'){
            return true;
        }else{
            return false;
        }

    }

    if(isFunc(executor) && this instanceof CbPromise){
        executor = executor;
    }else{
        throw new TypeError(`${executor} is not a function`)
    }

    
    function resovle(value){
        queueMicrotask(function(){
            if(
                self.status === CbPromise.PENDING){
                self.value = value;
                self.status = CbPromise.FULFILLED;
    
                self.taskQueue.forEach(function(v){
                    v.success()
                })

            }
        })
        
    };

    function reject(reason){ 
        queueMicrotask(function(){
            if(self.status === CbPromise.PENDING){
                self.reason = reason;
                self.status = CbPromise.REJECTED;
    
                self.taskQueue.forEach(function(value){
                    value.fail()
                })
            }
        })
    };
    try{
        executor(resovle,reject);
    }catch(e){
        reject(e)
    }
    
}

CbPromise.prototype.then = function(onfulfilled,onrejected){
    onfulfilled = typeof onfulfilled === 'function'? onfulfilled : function(v){return v};
    onrejected = typeof onrejected === 'function' ? onrejected : function(e){throw new Error(e);};

    let self = this ;
    let p2;

    // 以下部分是决议程序，但是由于有一部分没有完全看懂，所以只实现了A+的一部分
    // 

    function resolvePromsie(promise,result,resolve,reject){
        if(result instanceof CbPromise){
            result.then(resolve,reject)
        }else{
            resolve(result)
        }

        if(promise === result){
            reject('can not call self ')
        }
    }


    if(self.status === CbPromise.FULFILLED){
        // onfulfilled(self.value)
        return p2 = new CbPromise(function(resolve,reject){
            queueMicrotask(function(){
                try{
                    let result = onfulfilled(self.value);
                    resolvePromsie(p2,result,resolve,reject)
                }catch(e){
                    reject(e)
                }
            })
        })
    }

    if(self.status === CbPromise.REJECTED){
        // onrejected(self.value)
        return p2 = new CbPromise(function(resolve,reject){
            queueMicrotask(function(){
                try{
                    let result = onrejected(self.reason);
                    resolvePromsie(p2,result,resolve,reject)
                }catch(e){
                    reject(e)
                }
            })
        })
    }

    if(self.status === CbPromise.PENDING){
        return p2 = new CbPromise(function(resolve,reject){
            self.taskQueue.push({
            success:function(){
                queueMicrotask(function(){
                    try{
                        let result = onfulfilled(self.value);
                        resolvePromsie(p2,result,resolve,reject)
                    }catch(e){
                        reject(e)
                    }
                })
            },
            fail:function(){
                queueMicrotask(function(){
                    try{
                        let result = onrejected(self.reason);
                        resolvePromsie(p2,result,resolve,reject)
                    }catch(e){
                        reject(e)
                    }
                })
            }
        })
        })
        
    }

   
}

CbPromise.prototype.catch = function(func){
    return this.then(null,func);
}
 
CbPromise.resolve = function(value){
    return new CbPromise((resolve,reject)=>{
        resolve(value);
    })
}

CbPromise.reject = function(value){
    return new CbPromise((resolve,reject)=>{
        reject(value)
    })
}

CbPromise.all = function(arr){
    if(Array.isArray(arr)){
        return new CbPromise((resolve,reject)=>{
            try{
                let result = [] ;
                for(let item of arr){
                    item.then((v)=>{
                        result.push(v); 
                        if(result.length === arr.length){
                            // console.log(result);
                            resolve(result)
                        } 
                      
                    },(r)=>{
                        reject(r)
                    })
                    
                    
                }
              
                
            }catch(e){
                reject(e)
            }
        })
    }else{
        throw new TypeError(`${arr} is not array`)
    }
}

CbPromise.race = function(arr){
    if(Array.isArray(arr)){
        return new CbPromise((resolve,reject)=>{
            try{
                for(let [index,value] of arr.entries() ){
                     
                    value.then(resolve,reject);
                    // console.log(item);
                  

                }
            }catch(e){
                reject(e)
            }
            
            
        })
    }else{
        throw new TypeError(`${arr} is not array`)
    }
}

module.exports = CbPromise;
