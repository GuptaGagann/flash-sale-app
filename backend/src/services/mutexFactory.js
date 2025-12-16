// src/services/mutexFactory.js
// Simple mutex factory that returns a lock() function.
// No classes, uses closure state.

export function createMutex() {
    let locked = false;
    const waiters = [];

    // returns a promise that resolves to a release() function
    async function lock() {
        return new Promise((resolve) => {
            const tryAcquire = () => {
                if (!locked) {
                    locked = true;
                    resolve(release);
                } else {
                    waiters.push(tryAcquire);
                }
            };

            const release = () => {
                if (waiters.length > 0) {
                    // wake next waiter (call its tryAcquire)
                    const next = waiters.shift();
                    // schedule next attempt microtask to avoid sync reentrancy
                    queueMicrotask(next);
                } else {
                    locked = false;
                }
            };

            tryAcquire();
        });
    }

    return { lock };
}
