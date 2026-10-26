export interface Board {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

/** What the client sends to create a board - the server assigns the id. */
export type NewBoard = Omit<Board, 'id'>;
