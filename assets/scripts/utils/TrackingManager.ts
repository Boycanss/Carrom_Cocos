export enum TrackingEvents {
    START = 'start',
    FIRSTINTERACTION = 'firstInteraction',
    COMPLETE = 'complete',
    CTACLICK = 'ctaClick'
}

class TrackingManager {

    eventTrack: any = {
        start:{
            once: true,
            count: 0
        },
        firstInteraction:{
            once: true,
            count: 0
        },
        complete:{
            once: true,
            count: 0
        },
        ctaClick:{
            once: false,
            count: 0
        }
    }

    SendEventTracking(event: TrackingEvents, callback:any = null){
        if(this.eventTrack[event].once && this.eventTrack[event].count > 0){
            if(callback != null){
                callback();
            }
            return;
        }
        if (callback != null) {
            callback();
        }
        console.log(this.eventTrack);
        this.eventTrack[event].count++
    }
}

export default new TrackingManager;