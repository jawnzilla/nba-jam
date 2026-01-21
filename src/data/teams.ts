export interface Team {
  id: string;
  city: string;
  name: string;
  abbreviation: string;
  primaryColor: number;
  secondaryColor: number;
}

export const NBA_TEAMS: Team[] = [
  { id: 'atl', city: 'Atlanta', name: 'Hawks', abbreviation: 'ATL', primaryColor: 0xe03a3e, secondaryColor: 0xc1d32f },
  { id: 'bos', city: 'Boston', name: 'Celtics', abbreviation: 'BOS', primaryColor: 0x007a33, secondaryColor: 0xba9653 },
  { id: 'bkn', city: 'Brooklyn', name: 'Nets', abbreviation: 'BKN', primaryColor: 0x000000, secondaryColor: 0xffffff },
  { id: 'cha', city: 'Charlotte', name: 'Hornets', abbreviation: 'CHA', primaryColor: 0x1d1160, secondaryColor: 0x00788c },
  { id: 'chi', city: 'Chicago', name: 'Bulls', abbreviation: 'CHI', primaryColor: 0xce1141, secondaryColor: 0x000000 },
  { id: 'cle', city: 'Cleveland', name: 'Cavaliers', abbreviation: 'CLE', primaryColor: 0x860038, secondaryColor: 0xfdbb30 },
  { id: 'dal', city: 'Dallas', name: 'Mavericks', abbreviation: 'DAL', primaryColor: 0x00538c, secondaryColor: 0x002b5e },
  { id: 'den', city: 'Denver', name: 'Nuggets', abbreviation: 'DEN', primaryColor: 0x0e2240, secondaryColor: 0xfec524 },
  { id: 'det', city: 'Detroit', name: 'Pistons', abbreviation: 'DET', primaryColor: 0xc8102e, secondaryColor: 0x1d42ba },
  { id: 'gsw', city: 'Golden State', name: 'Warriors', abbreviation: 'GSW', primaryColor: 0x1d428a, secondaryColor: 0xffc72c },
  { id: 'hou', city: 'Houston', name: 'Rockets', abbreviation: 'HOU', primaryColor: 0xce1141, secondaryColor: 0x000000 },
  { id: 'ind', city: 'Indiana', name: 'Pacers', abbreviation: 'IND', primaryColor: 0x002d62, secondaryColor: 0xfdbb30 },
  { id: 'lac', city: 'Los Angeles', name: 'Clippers', abbreviation: 'LAC', primaryColor: 0xc8102e, secondaryColor: 0x1d428a },
  { id: 'lal', city: 'Los Angeles', name: 'Lakers', abbreviation: 'LAL', primaryColor: 0x552583, secondaryColor: 0xfdb927 },
  { id: 'mem', city: 'Memphis', name: 'Grizzlies', abbreviation: 'MEM', primaryColor: 0x5d76a9, secondaryColor: 0x12173f },
  { id: 'mia', city: 'Miami', name: 'Heat', abbreviation: 'MIA', primaryColor: 0x98002e, secondaryColor: 0xf9a01b },
  { id: 'mil', city: 'Milwaukee', name: 'Bucks', abbreviation: 'MIL', primaryColor: 0x00471b, secondaryColor: 0xeee1c6 },
  { id: 'min', city: 'Minnesota', name: 'Timberwolves', abbreviation: 'MIN', primaryColor: 0x0c2340, secondaryColor: 0x236192 },
  { id: 'nop', city: 'New Orleans', name: 'Pelicans', abbreviation: 'NOP', primaryColor: 0x0c2340, secondaryColor: 0xc8102e },
  { id: 'nyk', city: 'New York', name: 'Knicks', abbreviation: 'NYK', primaryColor: 0x006bb6, secondaryColor: 0xf58426 },
  { id: 'okc', city: 'Oklahoma City', name: 'Thunder', abbreviation: 'OKC', primaryColor: 0x007ac1, secondaryColor: 0xef3b24 },
  { id: 'orl', city: 'Orlando', name: 'Magic', abbreviation: 'ORL', primaryColor: 0x0077c0, secondaryColor: 0xc4ced4 },
  { id: 'phi', city: 'Philadelphia', name: '76ers', abbreviation: 'PHI', primaryColor: 0x006bb6, secondaryColor: 0xed174c },
  { id: 'phx', city: 'Phoenix', name: 'Suns', abbreviation: 'PHX', primaryColor: 0x1d1160, secondaryColor: 0xe56020 },
  { id: 'por', city: 'Portland', name: 'Trail Blazers', abbreviation: 'POR', primaryColor: 0xe03a3e, secondaryColor: 0x000000 },
  { id: 'sac', city: 'Sacramento', name: 'Kings', abbreviation: 'SAC', primaryColor: 0x5a2d81, secondaryColor: 0x63727a },
  { id: 'sas', city: 'San Antonio', name: 'Spurs', abbreviation: 'SAS', primaryColor: 0xc4ced4, secondaryColor: 0x000000 },
  { id: 'tor', city: 'Toronto', name: 'Raptors', abbreviation: 'TOR', primaryColor: 0xce1141, secondaryColor: 0x000000 },
  { id: 'uta', city: 'Utah', name: 'Jazz', abbreviation: 'UTA', primaryColor: 0x002b5c, secondaryColor: 0xf9a01b },
  { id: 'was', city: 'Washington', name: 'Wizards', abbreviation: 'WAS', primaryColor: 0x002b5c, secondaryColor: 0xe31837 },
];
