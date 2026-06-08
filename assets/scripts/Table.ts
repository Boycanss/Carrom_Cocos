import { _decorator, Component, Node, UITransform, BoxCollider2D, RigidBody2D, ERigidBody2DType } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Table')
export class Table extends Component {
    start() {
        const ui = this.node.getComponent(UITransform);
        if (!ui) {
            console.warn('Table: UITransform not found on table node. Walls not created.');
            return;
        }

        const width = ui.width;
        const height = ui.height;

        const thickness = 20; // thin wall thickness in local units

        const halfW = width / 2;
        const halfH = height / 2;

        // Top wall
        this.createWall('wall-top', width, thickness, 0, halfH - thickness / 2);
        // Bottom wall
        this.createWall('wall-bottom', width, thickness, 0, -halfH + (thickness / 2) + 50);
        // Left wall
        this.createWall('wall-left', thickness, height, -halfW + (thickness / 2) + 20, 0);
        // Right wall
        this.createWall('wall-right', thickness, height, halfW - (thickness / 2) - 20, 0);
    }

    private createWall(name: string, w: number, h: number, x: number, y: number, restitution = 0.9): Node {
        const wall = new Node(name);

        const ui = wall.addComponent(UITransform);
        ui.setContentSize(w, h);
        ui.anchorPoint.set(0.5, 0.5);

        const rb = wall.addComponent(RigidBody2D);
        rb.type = ERigidBody2DType.Static;

        const collider = wall.addComponent(BoxCollider2D);
        collider.size.set(w, h);
        collider.restitution = restitution;

        wall.setPosition(x, y);
        this.node.addChild(wall);

        return wall;
    }

    update(deltaTime: number) {}
}


