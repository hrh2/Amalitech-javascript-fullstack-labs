export interface Todo {
  id: number;
  /** Raw text as typed by the user. It is sanitised only when rendered as HTML. */
  description: string;
  completed: boolean;
}
