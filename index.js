class Observable {
  constructor(_subscribe) {
    this._subscribe = _subscribe;
  }
  subscribe(observer) {
    const subscriber = new Subscriber(observer);
    subscriber.add(this._subscribe(subscriber));
    return subscriber;
  }
  pipe(...operations) {
    return pipeFromArray(operations)(this)
  }
}

function pipeFromArray(fns) {
    if (fns.length === 0) {
        return x => x
    }
    if (fns.length === 1) {
        return fns[0]
    }
    return input => fns.reduce((prev, fn) => fn(prev), input)
}


function map(project) {
    return (observable) => new Observable(subscriber => {
        const subscription = observable.subscribe({
            next(value) {
                return subscriber.next(project(value))
            },
            error(err) {
                subscriber.error(err)
            },
            complete() {
                subscriber.complete()
            }
        })
        return subscription
    })
}

class Subscription {
  constructor() {
    this._teardowns = [];
  }
  unsubscribe() {
    this._teardowns.forEach((td) => {
      typeof td === "function" ? td() : td.unsubscribe();
    });
  }
  add(td) {
    if (td) {
      this._teardowns.push(td);
    }
  }
}
class Subscriber extends Subscription {
  constructor(observer) {
    super();
    this.observer = observer;
    this.isStopped = false;
  }
  next(value) {
    if (this.observer.next && !this.isStopped) {
      this.observer.next(value);
    }
  }
  error(value) {
    this.isStopped = true;
    if (this.observer.error) {
      this.observer.error(value);
    }
  }
  complete() {
    this.isStopped = true;
    if (this.observer.complete) {
      this.observer.complete();
    }
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

const source = new Observable((observer) => {
    let i = 0;
    const timer = setInterval(() => {
        observer.next(++i);
    }, 1000);
    return function unsubscribe() {
        clearInterval(timer);
    };
});
const subscription = source.pipe(
    map(i => i + 9),
    map(i => i * 2)
).subscribe({
    next: (v) => console.log(v),
    error: (err) => console.error(err),
    complete: () => console.log('complete'),
});

setTimeout(() => {
    subscription.unsubscribe();
}, 4500);
