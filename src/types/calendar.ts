export interface ContentType {
  name: string;
  color?: string;
  frequency?: number;
  weight?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  url?: string;
  contentType?: ContentType;
  platform?: string;
  topic?: string;
}

export interface CalendarEntry extends CalendarEvent {
  contentType: ContentType;
} 