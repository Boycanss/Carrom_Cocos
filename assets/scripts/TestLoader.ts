// Quick test to verify sprite loading
import { _decorator, Component, Node } from 'cc';
const { ccclass } = _decorator;

declare const images: any;

@ccclass('TestLoader')
export class TestLoader extends Component {
    start() {
        console.log('TestLoader: Checking images object');
        console.log('Images keys:', Object.keys(images));
        console.log('BG image exists:', !!images.bg);
        console.log('BG image length:', images.bg?.length || 0);
        console.log('BG image starts with:', images.bg?.substring(0, 50) || 'N/A');
    }
}
