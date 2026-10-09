import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { ModerationService } from '../../services/moderation/moderationService.js';
import { TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName("snap")
        .setDescription("Snap a user (special moderation action)")
        .addUserOption((option) =>
            option
                .setName("target")
                .setDescription("The user to snap")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("Reason for the snap"),
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
                'You must specify a user to snap.',
                { subtype: 'invalid_user' },
            );
        }
        if (user.id === interaction.user.id) {
            throw new TitanBotError(
                'Cannot snap self',
                ErrorTypes.VALIDATION,
                'You cannot snap yourself.',
            );
        }
        if (user.id === client.user.id) {
            throw new TitanBotError(
                'Cannot snap bot',
                ErrorTypes.VALIDATION,
                'You cannot snap the bot.',
            );
        }

        const result = await ModerationService.snapUser({
            guild: interaction.guild,
            user,
            moderator: interaction.member,
            reason,
        });

        await InteractionHelper.universalReply(interaction, {
            embeds: [
                successEmbed(
                    `🫰 **Snapped** ${user.tag}`,
                    `**Reason:** ${reason}\n**Case ID:** #${result.caseId}`,
                ),
            ],
        });
    },
};
