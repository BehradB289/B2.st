export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProposalStatus = 'draft' | 'published' | 'accepted' | 'rejected' | 'archived';

export interface Database {
  public: {
    Tables: {
      proposals: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          audio_hash: string;
          raw_transcription: string;
          structured_data: Json;
          client_name: string | null;
          project_title: string;
          total_amount: number;
          currency: string;
          status: ProposalStatus;
          processing_time_ms: number | null;
          audio_duration_seconds: number | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          audio_hash: string;
          raw_transcription: string;
          structured_data: Json;
          client_name?: string | null;
          project_title: string;
          total_amount: number;
          currency?: string;
          status?: ProposalStatus;
          processing_time_ms?: number | null;
          audio_duration_seconds?: number | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          audio_hash?: string;
          raw_transcription?: string;
          structured_data?: Json;
          client_name?: string | null;
          project_title?: string;
          total_amount?: number;
          currency?: string;
          status?: ProposalStatus;
          processing_time_ms?: number | null;
          audio_duration_seconds?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "proposals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      proposal_status: ProposalStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}