import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Collider2D, RigidBody2D, CircleCollider2D, BoxCollider2D, ERigidBody2DType, PhysicsMaterial } from 'cc';
const { ccclass } = _decorator;

export interface NodeConfig {
    spriteFrame?: SpriteFrame;
    width?: number;
    height?: number;
    colliderType?: 'circle' | 'box' | null;
    colliderRadius?: number;
    colliderSize?: { width: number; height: number };
    rigidBodyType?: 'dynamic' | 'static' | 'kinematic' | null;
    rigidBodyGravityScale?: number;
    position?: { x: number; y: number };
    linearDamping?: number;
    restitution?: number;
    anchorPoint?: { x: number; y: number };
}

@ccclass('NodeCreator')
export class NodeCreator extends Component {

    createNode(name: string, config?: NodeConfig): Node {
        const node = new Node(name);

        if (config?.spriteFrame) {
            const sprite = node.addComponent(Sprite);
            sprite.spriteFrame = config.spriteFrame;
        }

        this.setupUITransform(node, config);
        this.setupCollider(node, config);
        this.setupRigidBody(node, config);

        if (config?.position) {
            node.setPosition(config.position.x, config.position.y);
        }

        return node;
    }

    private setupUITransform(node: Node, config?: NodeConfig): void {
        const uiTransform = node.addComponent(UITransform);
        
        let width = 100;
        let height = 100;

        if (config?.spriteFrame?.texture) {
            const texture = config.spriteFrame.texture;
            width = config?.width || (texture as any).width || 100;
            height = config?.height || (texture as any).height || 100;
        } else if (config?.width && config?.height) {
            width = config.width;
            height = config.height;
        }

        uiTransform.setContentSize(width, height);
        config.anchorPoint ? uiTransform.anchorPoint.set(config.anchorPoint.x, config.anchorPoint.y) : uiTransform.anchorPoint.set(0.5, 0.5);
    }

    private setupCollider(node: Node, config?: NodeConfig): void {
        if (!config?.colliderType) return;

        if (config.colliderType === 'circle') {
            const collider = node.addComponent(CircleCollider2D);
            if (config.colliderRadius) {
                collider.radius = config.colliderRadius;
            }
             collider.restitution = config.restitution ?? 0;
        } else if (config.colliderType === 'box') {
            const collider = node.addComponent(BoxCollider2D);
            if (config.colliderSize) {
                collider.size.set(config.colliderSize.width, config.colliderSize.height);
            }
            collider.restitution = config.restitution ?? 0;
        }
    }

    private setupRigidBody(node: Node, config?: NodeConfig): void {
        if (!config?.rigidBodyType) return;

        const rigidBody = node.addComponent(RigidBody2D);
        rigidBody.linearDamping = config.linearDamping ?? 0;
        rigidBody.angularDamping = 2;
        rigidBody.enabledContactListener = true;
        if (config.rigidBodyType === 'dynamic') {
            rigidBody.type = ERigidBody2DType.Dynamic;
        } else if (config.rigidBodyType === 'static') {
            rigidBody.type = ERigidBody2DType.Static;
        } else if (config.rigidBodyType === 'kinematic') {
            rigidBody.type = ERigidBody2DType.Kinematic;
        }

        if (config.rigidBodyGravityScale !== undefined) {
            rigidBody.gravityScale = config.rigidBodyGravityScale;
        }
    }

    start() {}
    update(deltaTime: number) {}
}
