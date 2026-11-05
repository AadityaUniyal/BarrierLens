import { Page } from 'playwright';
import { SerializedAXNode } from './ax-serializer';

export interface MarkedElement {
  markId: number;
  selector: string;
  role: string;
  accessibleName: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SetOfMarksResult {
  markedElements: MarkedElement[];
  totalMarked: number;
}

/**
 * Set-of-Mark (SoM) Visual Grounding Engine
 * Superimposes discrete numerical badges onto interactive bounding boxes
 * for flawless visual grounding by multimodal LLMs (Gemini 2.5 Flash / Bedrock Nova).
 */
export class SetOfMarksEngine {
  /**
   * Inject high-contrast Set-of-Mark badges into the DOM
   */
  async injectMarks(page: Page, interactiveNodes: SerializedAXNode[]): Promise<SetOfMarksResult> {
    const validNodes = interactiveNodes.filter(n => n.boundingBox && n.boundingBox.width > 0 && n.boundingBox.height > 0);

    const result = await page.evaluate((nodes) => {
      // Remove any prior badges
      const existingContainer = document.getElementById('__barrierlens_som_container');
      if (existingContainer) existingContainer.remove();

      const container = document.createElement('div');
      container.id = '__barrierlens_som_container';
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '999999';

      const markedList: any[] = [];

      nodes.forEach((node, idx) => {
        const markId = idx + 1;
        const box = node.boundingBox;
        if (!box) return;

        // Badge wrapper
        const badge = document.createElement('div');
        badge.className = '__barrierlens_som_badge';
        badge.style.position = 'absolute';
        badge.style.left = `${box.x}px`;
        badge.style.top = `${Math.max(0, box.y - 14)}px`;
        badge.style.backgroundColor = '#0071e3';
        badge.style.color = '#ffffff';
        badge.style.fontSize = '11px';
        badge.style.fontWeight = 'bold';
        badge.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro", sans-serif';
        badge.style.padding = '1px 5px';
        badge.style.borderRadius = '4px';
        badge.style.boxShadow = '0 1px 4px rgba(0,0,0,0.4)';
        badge.style.border = '1px solid rgba(255,255,255,0.8)';
        badge.innerText = `[${markId}]`;

        // Highlight outline box
        const outline = document.createElement('div');
        outline.style.position = 'absolute';
        outline.style.left = `${box.x}px`;
        outline.style.top = `${box.y}px`;
        outline.style.width = `${box.width}px`;
        outline.style.height = `${box.height}px`;
        outline.style.border = '1.5px dashed rgba(0, 113, 227, 0.7)';
        outline.style.borderRadius = '3px';
        outline.style.pointerEvents = 'none';

        container.appendChild(outline);
        container.appendChild(badge);

        markedList.push({
          markId,
          selector: node.selector,
          role: node.role,
          accessibleName: node.name,
          box
        });
      });

      document.body.appendChild(container);
      return markedList;
    }, validNodes);

    return {
      markedElements: result,
      totalMarked: result.length
    };
  }

  /**
   * Remove all Set-of-Mark visual artifacts from the DOM
   */
  async clearMarks(page: Page): Promise<void> {
    try {
      await page.evaluate(() => {
        const container = document.getElementById('__barrierlens_som_container');
        if (container) container.remove();
      });
    } catch {
      // Ignored if page navigated
    }
  }
}
