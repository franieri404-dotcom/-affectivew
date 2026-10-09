import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { ModerationService } from '../../services/moderation/moderationService.js';
import { TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName("vanish")
        .setDescription("Make a user vanish (hide them)")
        .addUserOption((option) =>
            option
                .setName("target")
                .setDescription("The user to vanish")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("Reason for vanishing"),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    category: "moderation",
    async execute(interaction, config, client) {
        // Must be whitelisted
        const isWhitelisted = await ModerationService.isWhitelisted({
            guild: interaction.guild,
            user: interaction.user,
        });
        if (!isWhitelisted) {
            throw new TitanBotError(
                'Not whitelisted',
                ErrorTypes.PERMISSION,
                'You must be whitelisted to use this command.',
            );
        }

        const user = interaction.options.getUser("target");
        const reason = interaction.options.getString("reason") || "No reason provided";

        if (!user) {
            throw new TitanBotError(
                'Missing target user',
                ErrorTypes.USER_INPUT,
                'You must specify a user to vanish.',
                { subtype: 'invalid_user' },
            );
        }
        if (user.id === interaction.user.id) {
            throw new TitanBotError(
                'Cannot vanish self',
                ErrorTypes.VALIDATION,
                'You cannot vanish yourself.',
            );
        }
        if (user.id === client.user.id) {
            throw new TitanBotError(
                'Cannot vanish bot',
                ErrorTypes.VALIDATION,
                'You cannot vanish the bot.',
            );
        }

        const result = await ModerationService.vanishUser({
            guild: interaction.guild,
            user,
            moderator: interaction.member,
            reason,
        });

        await InteractionHelper.universalReply(interaction, {
            embeds: [
                successEmbed(
                    `👻 **Vanished** ${user.tag}`,
                    `**Reason:** ${reason}\n**Case ID:** #${result.caseId}`,
                ),
            ],
        });
    },
};
