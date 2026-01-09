import { Body, Container, Head, Html, Img, Preview, Section, Text, Tailwind, Font } from '@react-email/components';


interface TrialLayoutProps {
  children: React.ReactNode;
  preview?: string;
  style?: React.CSSProperties;
}

export const TrialLayout = ({ children, preview, style }: TrialLayoutProps) => {
  return (
    <Html>
      <Head>
        <Font
            fontFamily="Source Sans 3"
            fallbackFontFamily="sans-serif"
            webFont={{
              url: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap',
              format: 'woff2',
            }}
          />
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                background: '#FFFFFF',
                surface: '#FFFFFF',
                border: '#6b6c7e',
                text: '#54555f',
                heading: '#000000',
                primary: '#0b5fff',
                highlight: '#edf3fe', 
              },
            },
          },
        }}
      >
        <Body className="bg-white font-sans my-auto mx-auto px-2" style={{
            backgroundImage: "url('[$PORTAL_URL$]/documents/d/[$GROUP_KEY$]/backgroud-png')",
            backgroundSize: 'cover',
            backgroundPosition: 'left',
        }}>
            <Container className="bg-surface border border-border rounded-[16px] my-[64px] mx-auto p-[48px] h-[710px]" style={{ maxWidth: '925px', ...style }}>
                {/* Header */}
                <Section className="mb-[35px] mt-[35px] text-center">
                    <Img
                        src="[$PORTAL_URL$]/documents/d/[$GROUP_KEY$]/liferay_logo-png"
                        width="183"
                        height="58"
                        alt="Liferay Logo"
                        className="mx-auto"
                    />
                </Section>

                {/* Main Content */}
                <Section className="px-[112px]"> 
                {/* 7rem is approx 112px */}
                    {children}
                </Section>
            </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default TrialLayout;
