// Credit: https://stackoverflow.com/a/27078401, CC BY-SA 4.0
export function throttle(callback, limit) {
    let waiting = false;                     
    return function () {                     
        console.debug(`Waiting  ${waiting}`)
        if (!waiting) {                      
            waiting = true;                  
            console.debug(`Set waiting  ${waiting}`)
            setTimeout(() => {         
                waiting = false;             
                console.debug(`Set waiting ${waiting} (timeout)`)
            }, limit);
            return callback.apply(this, arguments); 
        }
    }
}