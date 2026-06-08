# Sprite Rendering Fix - Implementation Guide

## Problem
The sprites weren't rendering because:
1. **Texture not properly created** - Canvas wasn't being converted to Texture2D correctly
2. **SpriteFrame rect not set** - The sprite frame's rect wasn't defined
3. **Node size not configured** - Nodes didn't have proper UITransform size
4. **Missing parent-child relationships** - Sprites weren't properly added to parent nodes

## Solution

### 1. **SpriteLoader.ts** - Enhanced sprite loading
```typescript
// Key improvements:
- Properly create canvas from Base64 image
- Call texture.updateImage() to finalize texture
- Set spriteFrame.rect to match texture dimensions
- Added createSpriteNode() helper method
- Added loadAndCreateSpriteNode() for one-step loading
```

### 2. **GameManager.ts** - Proper sprite setup
```typescript
// Key improvements:
- Load sprite frames using Promise.all()
- Create sprite nodes using SpriteLoader.createSpriteNode()
- Add nodes as children to parent nodes (background, foreground, ingame)
- Setup node sizes using UITransform component
- Added error handling and logging
```

## How It Works

### Step 1: Load Sprite Frame
```typescript
const bgFrame = await this.spriteLoader.loadSpriteFrame('bg', images.bg);
```
- Loads Base64 image data
- Creates canvas and draws image
- Creates Texture2D from canvas
- Creates SpriteFrame with proper rect

### Step 2: Create Sprite Node
```typescript
this.bg = this.spriteLoader.createSpriteNode('bg', bgFrame);
```
- Creates new Node
- Adds Sprite component
- Assigns sprite frame to sprite

### Step 3: Add to Parent
```typescript
this.background.addChild(this.bg);
```
- Adds sprite node as child to parent node
- Establishes hierarchy: background → bg

### Step 4: Setup Size
```typescript
this.setupNodeSize(this.bg, bgFrame);
```
- Gets texture dimensions
- Sets UITransform content size
- Ensures proper rendering

## Scene Hierarchy

```
Scene
├── background (Node)
│   └── bg (Sprite Node) ← Background image
├── ingame (Node)
│   └── table (Sprite Node) ← Game table
└── foreground (Node)
    └── ctaBg (Sprite Node) ← CTA background
```

## Usage in GameManager

```typescript
async start() {
    // Load all sprites
    const [bgFrame, ctaBgFrame, tableFrame] = await Promise.all([
        this.spriteLoader.loadSpriteFrame('bg', images.bg),
        this.spriteLoader.loadSpriteFrame('ctaBg', images.cta_bg),
        this.spriteLoader.loadSpriteFrame('table', images.table)
    ]);

    // Create and add to parents
    this.bg = this.spriteLoader.createSpriteNode('bg', bgFrame);
    this.background.addChild(this.bg);
    this.setupNodeSize(this.bg, bgFrame);
}
```

## Key Components

### SpriteLoader Methods
- `loadSpriteFrame(key, base64Data)` - Load and cache sprite frame
- `createSpriteNode(name, spriteFrame)` - Create node with sprite
- `loadAndCreateSpriteNode(name, key, base64Data)` - One-step load and create
- `getSpriteFrame(key)` - Get cached sprite frame
- `clearAssets()` - Clear all cached assets

### GameManager Setup
- Requires SpriteLoader component attached to same node
- Requires foreground, ingame, background nodes assigned in inspector
- Loads sprites in start() method
- Automatically sizes nodes based on texture dimensions

## Debugging Tips

1. **Check console logs** - Look for "GameManager: ..." messages
2. **Verify parent nodes** - Ensure foreground, ingame, background are assigned
3. **Check texture dimensions** - Verify images are loading with correct size
4. **Inspect scene hierarchy** - Verify nodes are added as children
5. **Check UITransform** - Ensure content size is set correctly

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Blank scene | Nodes not added to parents | Verify addChild() is called |
| Invisible sprites | Node size is 0 | Call setupNodeSize() |
| Wrong position | No position set | Set node.position in GameManager |
| Texture not loading | Invalid Base64 | Check images.bg format in Define.ts |
| Memory leak | Assets not cleared | Call spriteLoader.clearAssets() when done |

## Next Steps

1. **Verify in Inspector** - Check that parent nodes are assigned
2. **Run the game** - Check console for load messages
3. **Adjust positions** - Set node.position if needed
4. **Adjust scales** - Set node.scale if sprites are too large/small
5. **Add more sprites** - Follow same pattern for additional images
