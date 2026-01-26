import z from 'zod';

export function isEmailAddressValid(emailAddress: string) {
    const { success } = z
        .object({ emailAddress: z.string().email() })
        .safeParse({
            emailAddress,
        });

    return success;
}
