import EncounterSOAPClient from './EncounterSOAPClient';

export const metadata = {
  title: 'SOAP Notes - Doctor Portal',
  description: 'Document patient encounter with SOAP notes and AI assistance',
};

export default async function EncounterSOAPPage({ params }) {
  const { id } = await params;
  return <EncounterSOAPClient encounterId={id} />;
}
