import { Word } from '@/lib/quran-api';
import { cn } from '@/lib/utils';

function toTajweedHtml(raw: string): string {
  return raw
    .replace(/<rule class=([a-z_]+)>/g, '<span class="tj-$1">')
    .replace(/<\/rule>/g, '</span>');
}

interface TajweedVerseProps {
  words: Word[];
  className?: string;
}

export function TajweedVerse({ words, className }: TajweedVerseProps) {
  const textWords = words.filter((w) => w.char_type_name === 'word' || !w.char_type_name);

  return (
    <p
      dir="rtl"
      className={cn(
        'font-arabic text-2xl md:text-4xl text-right leading-[2.2] md:leading-[2.5]',
        className
      )}
    >
      {textWords.map((word, i) => {
        const tajweedHtml = word.text_uthmani_tajweed
          ? toTajweedHtml(word.text_uthmani_tajweed)
          : null;
        return (
          <span key={word.id ?? i} className="inline">
            {tajweedHtml ? (
              <span dangerouslySetInnerHTML={{ __html: tajweedHtml }} />
            ) : (
              word.text_uthmani
            )}{' '}
          </span>
        );
      })}
    </p>
  );
}
