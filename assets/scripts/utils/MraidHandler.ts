import { _decorator, Component } from 'cc';
import {GameManager} from '../GameManager';
const { ccclass, property } = _decorator;

@ccclass('MraidHandler')
export class MraidHandler extends Component {
    @property(GameManager)
    GameManager: GameManager;

    private initialized: boolean = false;

    protected onLoad(): void {
        this.GameManager.enabled = false;
    }

    start() {
        const w: any = (<any>window);

        if (w.mraid) {
            const state = w.mraid.getState();
            console.log(">>> MRAID: mraid state: " + state + " - proceeding to viewability check");
            if (state && state !== 'loading') {
                this.mraidReady();
            } else {
                w.mraid.addEventListener('ready', this.mraidReady.bind(this));
                console.log(">>> MRAID: mraid state: " + state + " - waiting for ready event");
            }
            return;
        }else{
            //bypass
            console.log(">>> MRAID: bypassing viewable checking");
            this.showAd();
        }
    }

    mraidReady() {
        const w: any = (<any>window);
        if (!w.mraid.isViewable()) {
            w.mraid.addEventListener('viewableChange', this.mraidViewableChanged.bind(this));
        } else {
            this.adVisible();
        }
    }

    mraidViewableChanged(isViewable?: boolean) {
        const w: any = (<any>window);
        if (isViewable) {
            this.adVisible();
            return;
        }

        if (w.mraid.isViewable()) {
            this.adVisible();
        }
    }


    isMraidViewable(): boolean {
        const w: any = (<any>window);
        console.log(">>> MRAID: isViewable: "+ w.mraid.isViewable());
        return w.mraid.isViewable();
    }

    adVisible() {
        if (this.initialized) {
            return;
        }

        const w: any = (<any>window);
        if (!this.isMraidViewable()) {
            return;
        }
        this.showAd();
    }

    showAd() {
        console.log(">>> MRAID: SHOW AD");
        this.GameManager.enabled = true
        this.initialized = true;
    }
}


