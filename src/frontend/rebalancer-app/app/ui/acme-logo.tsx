import Image from 'next/image';

export default function AcmeLogo() {
  return (
    <div className="relative w-full h-full">
      <Image
        src="/logo.svg"
        alt="Logo"
        fill
        style={{ objectFit: 'contain', objectPosition: 'left center' }}
        priority
      />
    </div>
  );
}
