extort class Scheduler {
    private timers = new Map<string, number>()
    private number timer = 0
    constructor() {
        setTimeout(() => {
            this.tick.bind(this)}
        )
    }
    private tick() {
        this.timer--
        

    }
    set_timer(name, callback, countdown) {
        
    }
}