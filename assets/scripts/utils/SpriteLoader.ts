import { _decorator, assetManager, Component, ImageAsset, Node, Sprite, SpriteFrame, Texture2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SpriteLoader')
export class SpriteLoader extends Component {
    loadedAssets: Map<string, SpriteFrame> = new Map();

    loadSpriteFrame(key: string, base64Data: string): Promise<SpriteFrame> {
        if (this.loadedAssets.has(key)) {
            return Promise.resolve(this.loadedAssets.get(key)!);
        }

        return new Promise((resolve, reject) => {
            try {
                const img = new Image();

                img.onload = () => {
                    try {
                        const imageAsset = new ImageAsset(img);

                        const texture = new Texture2D();
                        texture.image = imageAsset;
  
                        const spriteFrame = new SpriteFrame();
                        spriteFrame.texture = texture;
                        spriteFrame.rect.set(0, 0, img.width, img.height);

                        this.loadedAssets.set(key, spriteFrame);
                        console.log(`SpriteLoader: Loaded '${key}' (${img.width}x${img.height})`);
                        resolve(spriteFrame);
                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = (err) => {
                    reject(new Error(`Failed to load image '${key}': ${err}`));
                };

                // Set the Base64 data as image source
                img.src = base64Data;
            } catch (error) {
                reject(error);
            }
        });
    }

    loadRemoteSpriteFrame(key: string, URL: string): Promise<SpriteFrame> {
        if (this.loadedAssets.has(key)) {
            return Promise.resolve(this.loadedAssets.get(key)!);
        }
        assetManager.loadRemote<ImageAsset>(URL, { ext: '.png' }, (err, imageAsset) => {
            try {
                const img = new Image();

                img.onload = () => {
                    try {
                        const texture = new Texture2D();
                        texture.image = imageAsset;
  
                        const spriteFrame = new SpriteFrame();
                        spriteFrame.texture = texture;
                        spriteFrame.rect.set(0, 0, img.width, img.height);

                        this.loadedAssets.set(key, spriteFrame);
                        console.log(`SpriteLoader: Loaded '${key}' (${img.width}x${img.height})`);
                    } catch (error) {
                        console.error(`SpriteLoader: Error creating sprite frame for '${key}':`, error);
                    }
                };

                img.onerror = (err) => {
                    console.error(`SpriteLoader: Failed to load image '${key}': ${err}`);
                };

            } catch (error) {
                console.error(`SpriteLoader: Error loading image '${key}':`, error);
            }
        })
    }

    createSpriteNode(nodeName: string, spriteFrame: SpriteFrame): Node {
        const node = new Node(nodeName);
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = spriteFrame;
        
        // Set node size to match sprite frame
        if (spriteFrame.texture) {
            node.setScale(1, 1);
        }
        
        console.log(`SpriteLoader: Created sprite node '${nodeName}'`);
        return node;
    }


    async loadAndCreateSpriteNode(nodeName: string, key: string, base64Data: string): Promise<Node> {
        const spriteFrame = await this.loadSpriteFrame(key, base64Data);
        return this.createSpriteNode(nodeName, spriteFrame);
    }

    getSpriteFrame(key: string): SpriteFrame | null {
        return this.loadedAssets.get(key) || null;
    }

    getLoadedAssetKeys(): string[] {
        return Array.from(this.loadedAssets.keys());
    }

    clearAssets(): void {
        this.loadedAssets.clear();
        console.log('SpriteLoader: All assets cleared');
    }

    start() {
        // Initialization if needed
    }

    update(deltaTime: number) {
        // Update logic if needed
    }
}
