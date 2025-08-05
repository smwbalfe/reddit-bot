import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';

type WelcomeEmailProps = {
    name?: string;
};

const WelcomeEmail = ({ name = 'there' }: WelcomeEmailProps) => {
    const currentYear = new Date().getFullYear();

    return (
        <Html>
            <Head />
            <Preview>Welcome to SubLead!</Preview>
            <Tailwind>
                <Body className="bg-gray-100 font-sans py-10">
                    <Container className="bg-white rounded-lg mx-auto p-8 max-w-xl">
                        <Section>
                            <Heading className="text-2xl font-bold text-gray-800 m-0 mb-4">
                                Welcome to SubLead, {name}!
                            </Heading>
                            <Text className="text-base text-gray-600 mb-6">
                                We're excited to have you join SubLead. Welcome aboard!
                            </Text>
                            <Text className="text-base text-gray-600">
                                Best,<br />
                                The SubLead Team
                            </Text>
                        </Section>
                        <Section>
                            <Text className="text-sm text-gray-500 mt-8 m-0">
                                © {currentYear} SubLead. All rights reserved.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

WelcomeEmail.PreviewProps = {
    name: 'Sarah',
};

export default WelcomeEmail;