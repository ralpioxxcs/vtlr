export default function handler(req, res) {
  const data = [
    { id: 1, name: 'Apple', color: 'Red' },
    { id: 2, name: 'Banana', color: 'Yellow' },
    { id: 3, name: 'Grapes', color: 'Purple' },
  ];
  res.status(200).json(data);
}
