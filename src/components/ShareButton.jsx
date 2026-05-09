import { useState } from "react";
import html2canvas from "html2canvas";
import { Download, Share2, Check } from "lucide-react";
import GlassButton from "./GlassButton";

export default function ShareButton({ targetRef }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSave = async () => {
    if (!targetRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const container = targetRef.current;
      const canvases = container.querySelectorAll("canvas");
      const replacements = [];

      canvases.forEach((canvas) => {
        const img = document.createElement("img");
        img.src = canvas.toDataURL("image/png");
        img.style.width = canvas.style.width;
        img.style.height = canvas.style.height;
        img.style.position = canvas.style.position || "absolute";
        img.style.top = canvas.style.top || "0";
        img.style.left = canvas.style.left || "0";
        img.setAttribute("data-canvas-replacement", "true");
        canvas.parentNode.insertBefore(img, canvas);
        canvas.style.display = "none";
        replacements.push({ canvas, img });
      });

      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const canvas = await html2canvas(container, {
        backgroundColor: "#f5f3f0",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      replacements.forEach(({ canvas: c, img }) => {
        c.style.display = "";
        img.remove();
      });

      const link = document.createElement("a");
      link.download = `blur-persona-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to capture:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    const text = "我刚刚在 Blur 测了自己的人格，结果很模糊但很有趣";

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Blur - 基本看不清的人格测试",
          text,
        });
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      <GlassButton onClick={handleSave} disabled={isCapturing}>
        <span className="flex items-center gap-2">
          {isCapturing ? (
            <>
              <div className="w-4 h-4 border-2 border-blur-text-muted border-t-transparent rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Download size={16} />
              保存结果
            </>
          )}
        </span>
      </GlassButton>

      <GlassButton variant="secondary" onClick={handleShare}>
        <span className="flex items-center gap-2">
          {isCopied ? (
            <>
              <Check size={16} className="text-green-600" />
              已复制
            </>
          ) : (
            <>
              <Share2 size={16} />
              分享
            </>
          )}
        </span>
      </GlassButton>
    </div>
  );
}
