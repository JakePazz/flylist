export type Tflight = {
  id: number,
  route: {
    dep_airport: string,
    arr_airport: string,
  },
  company: {
    fl_no: string,
    callsign: string,
  },
  ac_type: string,
  duration: number, // Minutes
  archived: boolean,
  last_edited: Date,
  created_at: Date,
}