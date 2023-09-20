export type returnTypeString =
  | {
      type: 'success'
      data: string
    }
  | {
      type: 'error'
      error: string
    }
export type returnTypeStringArray =
  | {
      type: 'success'
      data: string[]
    }
  | {
      type: 'error'
      error: string
    }
