export interface WorkflowSpecKey {
  WSID: string;
}

export interface WorkflowSpec extends WorkflowSpecKey {
  WVID?: string;
  WID?: string;
  NAID?: string;
  AID?: string;
  ACT?: string;
  created_at?: Date;
  updated_at?: Date;
}
