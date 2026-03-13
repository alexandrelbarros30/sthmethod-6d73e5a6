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
      "inline-flex items-center justify-center rounded shrink-0",
      "h-7 w-7 sm:h-8 sm:w-8",
      "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation",
      active && "bg-accent text-accent-foreground"
    )}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
));
MenuButton.displayName = "MenuButton";

const ToolbarSep = () => (
  <Separator orientation="vertical" className="h-4 sm:h-5 mx-0.5 shrink-0" />
);

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
          "min-h-[150px] sm:min-h-[200px] px-2 sm:px-3 py-2 focus:outline-none text-foreground text-sm leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_mark]:bg-primary/20 [&_mark]:text-foreground",
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
    <div className={cn("rounded-md border border-input bg-background overflow-hidden", className)}>
      {/* Toolbar - scrollable on mobile */}
      <div className="flex items-center gap-px overflow-x-auto scrollbar-none border-b border-input px-1 py-0.5">
        <MenuButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Título"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Subtítulo"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </MenuButton>

        <ToolbarSep />

        <MenuButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrito"
        >
          <Bold className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Itálico"
        >
          <Italic className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Sublinhado"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Tachado"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Destaque"
        >
          <Highlighter className="h-3.5 w-3.5" />
        </MenuButton>

        <ToolbarSep />

        <MenuButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista"
        >
          <List className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numerada"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </MenuButton>

        <ToolbarSep />

        <MenuButton
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Esquerda"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Centro"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Direita"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </MenuButton>

        <ToolbarSep />

        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Linha"
        >
          <Minus className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Desfazer"
        >
          <Undo className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Refazer"
        >
          <Redo className="h-3.5 w-3.5" />
        </MenuButton>
      </div>

      {/* Editor content */}
      <div className="overflow-y-auto max-h-[40vh]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
