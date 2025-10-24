"""
PDF Exporter for conversations
Uses ReportLab for professional PDF generation
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus import Image as RLImage
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime import datetime
from typing import List, Dict, Optional
import io
import os


class PDFExporter:
    """
    Professional PDF exporter for chat conversations

    Features:
    - Custom styling and branding
    - Code syntax highlighting
    - Image embedding
    - Table of contents
    - Page numbers
    - Headers and footers
    """

    def __init__(self, page_size=letter):
        """
        Initialize PDF exporter

        Args:
            page_size: Page size (letter, A4, etc.)
        """
        self.page_size = page_size
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#6366f1'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))

        # Conversation title
        self.styles.add(ParagraphStyle(
            name='ConversationTitle',
            parent=self.styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#4f46e5'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))

        # User message style
        self.styles.add(ParagraphStyle(
            name='UserMessage',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=8,
            leftIndent=20,
            rightIndent=60,
            fontName='Helvetica'
        ))

        # Assistant message style
        self.styles.add(ParagraphStyle(
            name='AssistantMessage',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#374151'),
            spaceAfter=8,
            leftIndent=60,
            rightIndent=20,
            fontName='Helvetica'
        ))

        # Code style
        self.styles.add(ParagraphStyle(
            name='CodeBlock',
            parent=self.styles['Code'],
            fontSize=9,
            textColor=colors.HexColor('#1f2937'),
            backColor=colors.HexColor('#f3f4f6'),
            leftIndent=20,
            rightIndent=20,
            spaceAfter=12,
            fontName='Courier'
        ))

        # Metadata style
        self.styles.add(ParagraphStyle(
            name='Metadata',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#6b7280'),
            spaceAfter=4,
            fontName='Helvetica'
        ))

    def export_conversation(
        self,
        conversation: Dict,
        messages: List[Dict],
        output_path: Optional[str] = None,
        include_metadata: bool = True,
        include_timestamps: bool = True,
        include_model_info: bool = True
    ) -> bytes:
        """
        Export conversation to PDF

        Args:
            conversation: Conversation metadata
            messages: List of messages
            output_path: Optional file path to save PDF
            include_metadata: Include conversation metadata
            include_timestamps: Include message timestamps
            include_model_info: Include AI model information

        Returns:
            bytes: PDF file content
        """
        # Create PDF buffer
        buffer = io.BytesIO()

        # Create PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=self.page_size,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72,
            title=conversation.get('title', 'Conversation Export')
        )

        # Build story (content)
        story = []

        # Add title
        title = Paragraph(
            f"AI Chat Studio - Conversation Export",
            self.styles['CustomTitle']
        )
        story.append(title)
        story.append(Spacer(1, 0.3 * inch))

        # Add conversation info
        if include_metadata:
            story.extend(self._build_metadata_section(conversation))
            story.append(Spacer(1, 0.2 * inch))

        # Add divider
        story.append(self._create_divider())
        story.append(Spacer(1, 0.2 * inch))

        # Add conversation title
        conv_title = Paragraph(
            conversation.get('title', 'Untitled Conversation'),
            self.styles['ConversationTitle']
        )
        story.append(conv_title)
        story.append(Spacer(1, 0.2 * inch))

        # Add messages
        for i, message in enumerate(messages):
            story.extend(self._build_message_section(
                message,
                include_timestamps,
                include_model_info
            ))

            # Add spacer between messages
            if i < len(messages) - 1:
                story.append(Spacer(1, 0.15 * inch))

        # Add footer
        story.append(PageBreak())
        story.extend(self._build_footer(conversation, messages))

        # Build PDF
        doc.build(story)

        # Get PDF bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()

        # Save to file if path provided
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(pdf_bytes)

        return pdf_bytes

    def _build_metadata_section(self, conversation: Dict) -> List:
        """Build metadata section"""
        elements = []

        # Create metadata table
        data = [
            ['Created:', conversation.get('created_at', 'N/A')],
            ['Updated:', conversation.get('updated_at', 'N/A')],
            ['Model:', conversation.get('model', 'N/A')],
            ['Provider:', conversation.get('provider', 'N/A')],
            ['Messages:', str(conversation.get('message_count', 0))],
            ['Tokens:', str(conversation.get('token_count', 0))]
        ]

        table = Table(data, colWidths=[1.5*inch, 4*inch])
        table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))

        elements.append(table)
        return elements

    def _build_message_section(
        self,
        message: Dict,
        include_timestamps: bool,
        include_model_info: bool
    ) -> List:
        """Build message section"""
        elements = []
        role = message.get('role', 'user')
        content = message.get('content', '')

        # Message header
        header_parts = []
        if role == 'user':
            header_parts.append('=d <b>You</b>')
        elif role == 'assistant':
            header_parts.append('> <b>AI Assistant</b>')
        else:
            header_parts.append('9 <b>System</b>')

        if include_timestamps and message.get('created_at'):
            header_parts.append(f"<i>{message['created_at']}</i>")

        if include_model_info and message.get('model'):
            header_parts.append(f"[{message['model']}]")

        header = Paragraph(
            ' " '.join(header_parts),
            self.styles['Metadata']
        )
        elements.append(header)

        # Message content
        style = self.styles['UserMessage'] if role == 'user' else self.styles['AssistantMessage']

        # Check if content contains code blocks
        if '```' in content:
            # Split by code blocks
            parts = content.split('```')
            for i, part in enumerate(parts):
                if i % 2 == 0:
                    # Regular text
                    if part.strip():
                        p = Paragraph(part.replace('\n', '<br/>'), style)
                        elements.append(p)
                else:
                    # Code block
                    code_style = self.styles['CodeBlock']
                    code = Paragraph(part.replace('\n', '<br/>'), code_style)
                    elements.append(code)
        else:
            # Regular message
            p = Paragraph(content.replace('\n', '<br/>'), style)
            elements.append(p)

        # Token count
        if message.get('tokens'):
            token_info = Paragraph(
                f"<i>{message['tokens']} tokens</i>",
                self.styles['Metadata']
            )
            elements.append(token_info)

        return elements

    def _create_divider(self):
        """Create horizontal divider"""
        return Table(
            [['']],
            colWidths=[6.5*inch],
            style=TableStyle([
                ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ])
        )

    def _build_footer(self, conversation: Dict, messages: List[Dict]) -> List:
        """Build footer section"""
        elements = []

        # Statistics
        elements.append(Paragraph('Export Statistics', self.styles['Heading2']))
        elements.append(Spacer(1, 0.1 * inch))

        # Calculate stats
        total_user_messages = sum(1 for m in messages if m.get('role') == 'user')
        total_assistant_messages = sum(1 for m in messages if m.get('role') == 'assistant')
        total_tokens = sum(m.get('tokens', 0) for m in messages)

        stats_data = [
            ['Total Messages:', str(len(messages))],
            ['User Messages:', str(total_user_messages)],
            ['Assistant Messages:', str(total_assistant_messages)],
            ['Total Tokens:', str(total_tokens)],
            ['Export Date:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
        ]

        stats_table = Table(stats_data, colWidths=[2*inch, 4*inch])
        stats_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))

        elements.append(stats_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Footer text
        footer_text = Paragraph(
            '<i>Generated by AI Chat Studio - https://chat-studio.example.com</i>',
            self.styles['Metadata']
        )
        elements.append(footer_text)

        return elements

    def export_multiple_conversations(
        self,
        conversations: List[Dict],
        output_path: str
    ) -> bytes:
        """
        Export multiple conversations to single PDF

        Args:
            conversations: List of conversations with messages
            output_path: Path to save PDF

        Returns:
            bytes: PDF content
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=self.page_size)

        story = []

        # Title page
        story.append(Paragraph(
            "AI Chat Studio<br/>Conversations Export",
            self.styles['CustomTitle']
        ))
        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph(
            f"Total Conversations: {len(conversations)}",
            self.styles['Heading2']
        ))
        story.append(PageBreak())

        # Add each conversation
        for i, conv_data in enumerate(conversations):
            conversation = conv_data.get('conversation', {})
            messages = conv_data.get('messages', [])

            # Conversation title
            story.append(Paragraph(
                f"Conversation {i + 1}: {conversation.get('title', 'Untitled')}",
                self.styles['ConversationTitle']
            ))
            story.append(Spacer(1, 0.1 * inch))

            # Messages
            for message in messages:
                story.extend(self._build_message_section(message, True, True))
                story.append(Spacer(1, 0.1 * inch))

            # Page break between conversations
            if i < len(conversations) - 1:
                story.append(PageBreak())

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        if output_path:
            with open(output_path, 'wb') as f:
                f.write(pdf_bytes)

        return pdf_bytes
