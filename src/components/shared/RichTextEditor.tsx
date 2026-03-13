import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
  Highlighter,
  Undo,
  Redo,
  Minus,
} from "lucide-react";
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuButton = React.forwardRef<
  HTMLButtonElement,
  {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }
>(({ active, onClick, children, title }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "inline-flex items-center justify-center rounded-md h-8 w-8 shrink-0 touch-manipulation",
      "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
      active && "bg-accent text-accent-foreground"
    )}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
));
MenuButton.displayName = "MenuButton";

const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[180px] px-3 py-2 focus:outline-none text-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_mark]:bg-primary/20 [&_mark]:text-foreground",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value]);

  if (!editor) return null;

  return (
    <div className={cn("rounded-md border border-input bg-background", className)}>
      {/* Toolbar - mobile-optimized with scrollable rows */}
      <div className="border-b border-input">
        {/* Row 1: Text formatting */}
        <div className="flex items-center gap-0.5 px-1 py-1 overflow-x-auto scrollbar-none">
          <MenuButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Título"
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Subtítulo"
          >
            <Heading3 className="h-4 w-4" />
          </MenuButton>

          <Separator orientation="vertical" className="h-5 mx-0.5 shrink-0" />

          <MenuButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Negrito"
          >
            <Bold className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Itálico"
          >
            <Italic className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Sublinhado"
          >
            <UnderlineIcon className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Tachado"
          >
            <Strikethrough className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            active={editor.isActive("highlight")}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            title="Destaque"
          >
            <Highlighter className="h-4 w-4" />
          </MenuButton>

          <Separator orientation="vertical" className="h-5 mx-0.5 shrink-0" />

          <MenuButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Lista"
          >
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Lista Numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>

          <Separator orientation="vertical" className="h-5 mx-0.5 shrink-0" />

          <MenuButton
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            title="Esquerda"
          >
            <AlignLeft className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            title="Centro"
          >
            <AlignCenter className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            title="Direita"
          >
            <AlignRight className="h-4 w-4" />
          </MenuButton>

          <Separator orientation="vertical" className="h-5 mx-0.5 shrink-0" />

          <MenuButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Linha"
          >
            <Minus className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Desfazer"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Refazer"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
