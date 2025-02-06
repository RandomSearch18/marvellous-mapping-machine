// Credit: Based on https://stackoverflow.com/a/27078401, CC BY-SA 4.0
export const CANCELLED = Symbol("throttle-cancelled")

export function throttle(callback, limit) {
    let waiting = false;                     
    return function () {                     
        if (waiting) {
            return CANCELLED
        }
        waiting = true;                  
        setTimeout(() => {         
            waiting = false;             
        }, limit);
        return callback.apply(this, arguments); 
    }
}