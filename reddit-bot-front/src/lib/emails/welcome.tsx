import * as React from 'react';
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';

const WelcomeEmail = ({ name = 'there' }) => {
    const currentYear = new Date().getFullYear();

    return (
        <Html>
            <Head />
            <Preview>Welcome to our platform! Complete your account setup</Preview>
            <Tailwind>
                <Body className="bg-gray-100 font-sans py-[40px]">
                    <Container className="bg-white rounded-[8px] mx-auto p-[20px] max-w-[600px]">
                        <Section>
                            <Heading className="text-[24px] font-bold text-gray-800 m-0 mb-[16px]">
                                Welcome, {name}!
                            </Heading>
                            <Text className="text-[16px] text-gray-600 mb-[24px]">
                                Thank you for joining our platform. We're thrilled to have you as part of our community and can't wait to help you get the most out of your experience.
                            </Text>
                            <Text className="text-[16px] text-gray-600 mb-[24px]">
                                To ensure you have the best possible start, please take a moment to complete your account setup. This will unlock all the features and personalize your experience.
                            </Text>
                            <Section className="text-center my-[32px]">
                                <Button
                                    className="bg-blue-600 text-white font-bold no-underline text-center px-[24px] py-[16px] rounded-[8px] box-border"
                                    href="https://example.com/complete-setup"
                                >
                                    Complete Your Setup
                                </Button>
                            </Section>
                            <Text className="text-[16px] text-gray-600 mb-[24px]">
                                If you have any questions or need assistance, don't hesitate to reach out to our support team. We're here to help!
                            </Text>
                            <Text className="text-[16px] text-gray-600">
                                Best regards,<br />
                                The Team
                            </Text>
                        </Section>
                        <Hr className="border-gray-200 my-[24px]" />
                        <Section>
                            <Text className="text-[14px] text-gray-500 m-0">
                                © {currentYear} Our Company. All rights reserved.
                            </Text>
                            <Text className="text-[14px] text-gray-500 m-0">
                                123 Main St, Anytown, AT 12345
                            </Text>
                            <Text className="text-[14px] text-gray-500 m-0">
                                <a href="https://example.com/unsubscribe" className="text-blue-500 underline">
                                    Unsubscribe
                                </a>
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