export interface triangle {
  UserCoord:{
    coords: number[],
    distance: {
      SatCoord1: number,
      SatCoord2: number
    }
  },
  SatCoord1:{
    coords: number[],
    offset: number,
    distance: {
      UserCoord: number,
      SatCoord2: number
    }
  },
  SatCoord2:{
    coords: number[],
    offset: number,
    distance: {
      SatCoord1: number,
      UserCoord: number
    }
  }
}
